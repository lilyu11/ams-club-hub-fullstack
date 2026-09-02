import random
import time as _time
import uuid
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from datetime import timezone

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.redis import get_redis
from app.core.rate_limit import (
    get_rate_limiter,
    get_client_ip,
    create_rate_limit_key,
    OTP_SEND_LIMIT,
    OTP_SEND_WINDOW,
    OTP_SEND_COOLDOWN,
    OTP_BLOCK_DURATION
)
from app.models.user import User, UserRole
from app.schemas.auth import Token, TokenResponse, RefreshTokenRequest, UserResponse
from app.services.email_service import send_otp_email, send_reset_password_otp_email, hash_otp
from app.core.security import create_refresh_token, store_refresh_token, verify_refresh_token, revoke_refresh_token, revoke_all_refresh_tokens

router = APIRouter(prefix="/auth", tags=["Authentication"])

# OTP config
OTP_EXPIRE_MINUTES = 5
OTP_MAX_ATTEMPTS = 5
OTP_RESEND_COOLDOWN_SECONDS = 60

# Random suffix for internal admin registration endpoint (security through obscurity)
# Only SUPER_ADMIN should know this suffix
INTERNAL_REGISTER_SUFFIX = "x7k9m2p4"

# Redis key prefixes
OTP_STORE_PREFIX = "otp:register"
OTP_RESET_PREFIX = "otp:reset"


async def get_otp_store():
    # Lấy OTP lưu trữ trên Redis để đăng ký
    redis = get_redis()
    return redis


async def get_reset_otp_store():
    # Lấy OTP lưu trữ trên Redis để đổi mật khẩu
    redis = get_redis()
    return redis


async def store_otp(email: str, otp_code: str, purpose: str = "register"):
    # Lưu trữ OTP trong Redis với thời gian tự động xóa (TTL - Time to live)
    redis = get_redis()
    if not redis:
        return
    prefix = OTP_STORE_PREFIX if purpose == "register" else OTP_RESET_PREFIX
    key = f"{prefix}:{email}"
    data = {
        "otp": hash_otp(otp_code),
        "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRE_MINUTES)).isoformat(),
        "attempts": 0,
        "last_sent_at": datetime.now(timezone.utc).isoformat()
    }
    await redis.hset(key, mapping=data)
    await redis.expire(key, OTP_EXPIRE_MINUTES * 60)


async def get_stored_otp(email: str, purpose: str = "register") -> dict | None:
    # Lấy OTP được lưu trữ trong Redis
    redis = get_redis()
    if not redis:
        return None
    prefix = OTP_STORE_PREFIX if purpose == "register" else OTP_RESET_PREFIX
    key = f"{prefix}:{email}"
    data = await redis.hgetall(key)
    if not data:
        return None
    # Chuyển đổi dãy ký tự về các mảng giá trị
    return {
        "otp": data.get("otp"),
        "expires_at": datetime.fromisoformat(data.get("expires_at")) if data.get("expires_at") else None,
        "attempts": int(data.get("attempts", 0)),
        "last_sent_at": datetime.fromisoformat(data.get("last_sent_at")) if data.get("last_sent_at") else None
    }


async def increment_otp_attempts(email: str, purpose: str = "register"):
    # Đếm số lần OTP được lưu trong Redis (có giới hạn)
    redis = get_redis()
    if not redis:
        return
    prefix = OTP_STORE_PREFIX if purpose == "register" else OTP_RESET_PREFIX
    key = f"{prefix}:{email}"
    await redis.hincrby(key, "attempts", 1)


async def delete_otp(email: str, purpose: str = "register"):
    # Xóa OTP trong Redis sau khi được sử dụng thành công
    redis = get_redis()
    if not redis:
        return
    prefix = OTP_STORE_PREFIX if purpose == "register" else OTP_RESET_PREFIX
    key = f"{prefix}:{email}"
    await redis.delete(key)


async def check_rate_limit_otp(request: Request, email: str, purpose: str = "register"):
    # Kiếm tra IP và rate limiting gửi OTP
    rate_limiter = get_rate_limiter()
    if not rate_limiter:
        return True, None

    ip = await get_client_ip(request)
    key = create_rate_limit_key(f"otp:{purpose}", ip, email)

    # Check if blocked
    if await rate_limiter.is_blocked(key):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Quá nhiều yêu cầu. Vui lòng thử lại sau 15 phút."
        )

    # Check rate limit
    allowed, info = await rate_limiter.check_rate_limit(
        key=key,
        limit=OTP_SEND_LIMIT,
        window_seconds=OTP_SEND_WINDOW,
        block_seconds=OTP_BLOCK_DURATION
    )

    if not allowed:
        reset_minutes = (info["reset"] - int(_time.time())) // 60 + 1
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Đã vượt quá giới hạn {OTP_SEND_LIMIT} lần gửi OTP trong 15 phút. Vui lòng thử lại sau {reset_minutes} phút."
        )

    return True, info


class SendOTPRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str


class RegisterWithOTPRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    otp: str

class RegisterWithoutOTP(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str
    student_id: str

class ForgotPasswordSendOTPRequest(BaseModel):
    email: EmailStr


class ForgotPasswordResetRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str


def is_valid_password(pwd: str) -> bool:
    """
    Validate password:
    - Ít nhất 8 ký tự
    - Tối đa 72 ký tự (giới hạn bcrypt)
    - Không được chỉ chứa chữ
    - Không được chỉ chứa số
    """
    if len(pwd) < 8:
        return False
    if len(pwd) > 72:
        return False
    if pwd.isdigit():  # Chỉ có số
        return False
    if pwd.isalpha():  # Chỉ có chữ
        return False
    return True


@router.post("/send-otp", status_code=status.HTTP_200_OK)
async def send_otp(data: SendOTPRequest, request: Request, db: Session = Depends(get_db)):
    # Kiểm tra quy tắc mật khẩu
    if not is_valid_password(data.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mật khẩu phải dài từ 8-72 ký tự và phải bao gồm cả chữ lẫn số/ký tự đặc biệt."
        )

    # Kiểm tra email đã tồn tại trong hệ thống chưa
    existing_user = db.query(User).filter(User.email == data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email này đã được sử dụng trong hệ thống..."
        )

    # IP-based rate limiting: 60s/1 request, tối đa 3 requests trong 15p
    await check_rate_limit_otp(request, data.email, "register")

    # Per-email cooldown: 60s
    stored = await get_stored_otp(data.email, "register")
    if stored and stored.get("last_sent_at"):
        elapsed = datetime.now(timezone.utc) - stored["last_sent_at"]
        if elapsed < timedelta(seconds=OTP_RESEND_COOLDOWN_SECONDS):
            wait_seconds = OTP_RESEND_COOLDOWN_SECONDS - int(elapsed.total_seconds())
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Vui lòng chờ {wait_seconds} giây trước khi gửi lại mã OTP."
            )

    # Tạo mã OTP 6 chữ số và lưu hash vào Redis
    otp_code = f"{random.randint(100000, 999999)}"
    await store_otp(data.email, otp_code, "register")

    # Gửi email OTP
    success = await send_otp_email(data.email, otp_code)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Không thể gửi mã OTP... Vui lòng kiểm tra lại thông tin."
        )

    return {"message": "Mã OTP đã được gửi thành công đến email của bạn!"}

@router.post(f"/register-without-otp-{INTERNAL_REGISTER_SUFFIX}", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register_without_otp(
    data: RegisterWithoutOTP,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Chỉ SUPER_ADMIN mới được dùng endpoint nội bộ này
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ Super Admin mới có quyền sử dụng tính năng này."
        )

    # Không cho phép tạo SUPER_ADMIN qua endpoint này
    if data.role == UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Không thể tạo tài khoản Super Admin qua endpoint này."
        )

    # Kiểm tra email tồn tại trong database không
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email này đã được sử dụng trong hệ thống..."
        )

    # Validate role chỉ được là STUDENT hoặc CLUB_ADMIN
    if data.role not in (UserRole.STUDENT, UserRole.CLUB_ADMIN):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role không hợp lệ. Chỉ cho phép STUDENT hoặc CLUB_ADMIN."
        )

    # Tạo user mới
    hashed_pwd = get_password_hash(data.password)
    new_user = User(
        email=data.email,
        hashed_password=hashed_pwd,
        full_name=data.full_name,
        role=data.role,
        student_id=data.student_id,
        is_active=True
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Tạo token pair cho auto-login
    access_token = create_access_token(subject=new_user.id)
    refresh_plain, refresh_hash = create_refresh_token(subject=new_user.id)
    await store_refresh_token(new_user.id, refresh_hash)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_plain,
        token_type="bearer"
    )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(data: RegisterWithOTPRequest, db: Session = Depends(get_db)):
    # Kiểm tra OTP có tồn tại không
    stored_data = await get_stored_otp(data.email, "register")
    if not stored_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mã OTP không tồn tại hoặc chưa được gửi..."
        )

    # Kiểm tra OTP đã hết hạn chưa
    if datetime.now(timezone.utc) > stored_data["expires_at"]:
        await delete_otp(data.email, "register")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mã OTP đã hết hạn... Vui lòng lấy lại mã mới."
        )

    # Giới hạn số lần nhập sai OTP
    if stored_data.get("attempts", 0) >= OTP_MAX_ATTEMPTS:
        await delete_otp(data.email, "register")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bạn đã nhập sai quá nhiều lần. Vui lòng gửi lại mã OTP."
        )

    # Kiểm tra mã OTP có chính xác không (so sánh hash)
    otp_hash = hash_otp(data.otp.strip())
    if stored_data["otp"] != otp_hash:
        await increment_otp_attempts(data.email, "register")
        remaining = OTP_MAX_ATTEMPTS - stored_data.get("attempts", 0) - 1
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Mã OTP không chính xác... Còn {remaining} lần thử."
        )

    # Kiểm tra email có tồn tại trong database không
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email này đã được sử dụng trong hệ thống..."
        )

    # Tạo user mới (mặc định role = STUDENT, student_id = None)
    hashed_pwd = get_password_hash(data.password)
    new_user = User(
        email=data.email,
        hashed_password=hashed_pwd,
        full_name=data.full_name,
        role=UserRole.STUDENT,
        student_id=None,
        is_active=True
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Xóa OTP đã sử dụng thành công
    await delete_otp(data.email, "register")

    # Tạo token pair cho auto-login sau đăng ký
    access_token = create_access_token(subject=new_user.id)
    refresh_plain, refresh_hash = create_refresh_token(subject=new_user.id)
    await store_refresh_token(new_user.id, refresh_hash)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_plain,
        token_type="bearer"
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    # API Đăng nhập lấy JWT Access Token + Refresh Token
    user = db.query(User).filter(User.email == form_data.username).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email hoặc mật khẩu không chính xác...",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tài khoản này hiện đang bị khóa."
        )

    access_token = create_access_token(subject=user.id)
    refresh_plain, refresh_hash = create_refresh_token(subject=user.id)
    await store_refresh_token(user.id, refresh_hash)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_plain,
        token_type="bearer"
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    data: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """
    Refresh access token sử dụng refresh token (rotation)
    - Verify refresh token trong Redis
    - Revoke refresh token cũ (rotation)
    - Tạo cặp token mới (access + refresh)
    """
    refresh_plain = data.refresh_token

    # Tìm user_id từ refresh token (scan Redis)
    redis = get_redis()
    if not redis:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Dịch vụ xác thực tạm thời không khả dụng."
        )

    # Scan tất cả refresh tokens để tìm match (chỉ khi số lượng ít)
    # Production nên có index user_id -> refresh_hash mapping
    user_id = None
    async for key in redis.scan_iter(match=f"refresh:*:*"):
        # key format: refresh:{user_id}:{hash}
        parts = key.split(":")
        if len(parts) >= 3:
            test_user_id = parts[1]
            refresh_hash = parts[2]
            # Verify bằng cách hash token plain và so sánh
            import hashlib
            test_hash = hashlib.sha256(data.refresh_token.encode()).hexdigest()
            if test_hash == refresh_hash:
                user_id = test_user_id
                break

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token không hợp lệ hoặc đã hết hạn.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verify user tồn tại và active
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        # Revoke token của user không tồn tại/bị khóa
        await revoke_all_refresh_tokens(user_id)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tài khoản không tồn tại hoặc đã bị khóa.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Rotation: revoke refresh token cũ
    await revoke_refresh_token(user_id, data.refresh_token)

    # Tạo cặp token mới
    access_token = create_access_token(subject=user.id)
    refresh_plain, refresh_hash = create_refresh_token(subject=user_id)
    await store_refresh_token(user_id, refresh_hash)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_plain,
        token_type="bearer"
    )


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(
    data: RefreshTokenRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Logout: revoke refresh token hiện tại
    Client có thể gọi endpoint này khi user logout
    """
    await revoke_refresh_token(current_user.id, data.refresh_token)
    return {"message": "Đăng xuất thành công."}


@router.post("/logout-all", status_code=status.HTTP_200_OK)
async def logout_all(
    current_user: User = Depends(get_current_user)
):
    # Logout khỏi tất cả thiết bị: revoke tất cả refresh token của user
  
    count = await revoke_all_refresh_tokens(current_user.id)
    return {"message": f"Đã đăng xuất khỏi tất cả thiết bị ({count} session)."}


@router.post("/forgot-password/send-otp", status_code=status.HTTP_200_OK)
async def forgot_password_send_otp(data: ForgotPasswordSendOTPRequest, request: Request, db: Session = Depends(get_db)):
    # Kiểm tra email có tồn tại trong database không
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email này chưa được đăng ký trong hệ thống."
        )

    # IP-based rate limiting: 60s/1 request, max 3 requests per 15 minutes
    await check_rate_limit_otp(request, data.email, "reset")

    # Per-email cooldown: 60 seconds
    stored = await get_stored_otp(data.email, "reset")
    if stored and stored.get("last_sent_at"):
        elapsed = datetime.now(timezone.utc) - stored["last_sent_at"]
        if elapsed < timedelta(seconds=OTP_RESEND_COOLDOWN_SECONDS):
            wait_seconds = OTP_RESEND_COOLDOWN_SECONDS - int(elapsed.total_seconds())
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Vui lòng chờ {wait_seconds} giây trước khi gửi lại mã OTP."
            )

    # Tạo mã OTP 6 chữ số & lưu hash vào Redis
    otp_code = f"{random.randint(100000, 999999)}"
    await store_otp(data.email, otp_code, "reset")

    # Gửi email OTP
    success = await send_reset_password_otp_email(data.email, otp_code)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại sau."
        )

    return {"message": "Mã OTP khôi phục mật khẩu đã được gửi thành công!"}


@router.post("/forgot-password/reset", status_code=status.HTTP_200_OK)
async def forgot_password_reset(data: ForgotPasswordResetRequest, db: Session = Depends(get_db)):
    # Kiểm tra OTP tồn tại
    stored_data = await get_stored_otp(data.email, "reset")
    if not stored_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mã OTP không tồn tại hoặc chưa được gửi."
        )

    # Kiểm tra hết hạn
    if datetime.now(timezone.utc) > stored_data["expires_at"]:
        await delete_otp(data.email, "reset")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mã OTP đã hết hạn. Vui lòng lấy lại mã mới."
        )

    # Giới hạn số lần nhập sai OTP
    if stored_data.get("attempts", 0) >= OTP_MAX_ATTEMPTS:
        await delete_otp(data.email, "reset")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bạn đã nhập sai quá nhiều lần. Vui lòng gửi lại mã OTP."
        )

    # Kiểm tra OTP đúng (so sánh hash)
    otp_hash = hash_otp(data.otp.strip())
    if stored_data["otp"] != otp_hash:
        await increment_otp_attempts(data.email, "reset")
        remaining = OTP_MAX_ATTEMPTS - stored_data.get("attempts", 0) - 1
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Mã OTP không chính xác. Còn {remaining} lần thử."
        )

    # Validate mật khẩu mới
    if not is_valid_password(data.new_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mật khẩu mới phải từ 8-72 ký tự, bao gồm cả chữ và số/ký tự đặc biệt."
        )

    # Cập nhật mật khẩu trong DB
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Người dùng không tồn tại.")

    user.hashed_password = get_password_hash(data.new_password)
    db.commit()

    # Xóa OTP đã dùng
    await delete_otp(data.email, "reset")

    return {"message": "Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay."}