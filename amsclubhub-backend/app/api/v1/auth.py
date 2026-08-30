import random
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from datetime import timezone

from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.user import User, UserRole
from app.schemas.auth import Token, UserResponse
from app.services.email_service import send_otp_email, send_reset_password_otp_email

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Bộ nhớ tạm lưu mã OTP (Email -> {otp, expires_at})
otp_store = {}
# Bộ nhớ tạm lưu OTP quên mật khẩu (Email -> {otp, expires_at})
reset_otp_store = {}


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
    """Validate: ít nhất 8 ký tự, không được chỉ chứa chữ, không được chỉ chứa số"""
    if len(pwd) < 8:
        return False
    if pwd.isdigit():  # Chỉ có số
        return False
    if pwd.isalpha():  # Chỉ có chữ
        return False
    return True


@router.post("/send-otp", status_code=status.HTTP_200_OK)
async def send_otp(data: SendOTPRequest, db: Session = Depends(get_db)):
    # Kiểm tra quy tắc mật khẩu
    if not is_valid_password(data.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mật khẩu phải dài ít nhất 8 ký tự và phải bao gồm cả chữ lẫn số/ký tự đặc biệt."
        )

    # Kiểm tra email đã tồn tại trong hệ thống chưa
    existing_user = db.query(User).filter(User.email == data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email này đã được sử dụng trong hệ thống..."
        )

    # Tạo mã OTP 6 chữ số và thiết lập thời gian hết hạn 5 phút
    otp_code = f"{random.randint(100000, 999999)}"
    otp_store[data.email] = {
        "otp": otp_code,
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=5)
    }

    # Gửi email OTP
    success = await send_otp_email(data.email, otp_code)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Không thể gửi mã OTP...Vui lòng kiểm tra lại email."
        )

    return {"message": "Mã OTP đã được gửi thành công đến email của bạn!"}

@router.post("/register-without-otp", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_without_otp(data: RegisterWithoutOTP, db: Session = Depends(get_db)):
    # Kiểm tra email tồn tại trong database không
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email này đã được sử dụng trong hệ thống..."
        )

    # Tạo user mới (được kiểm soát role và student_id)
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

    return new_user


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(data: RegisterWithOTPRequest, db: Session = Depends(get_db)):
    # Kiểm tra OTP có tồn tại không
    stored_data = otp_store.get(data.email)
    if not stored_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mã OTP không tồn tại hoặc chưa được gửi..."
        )

    # Kiểm tra OTP đã hết hạn chưa
    if datetime.now(timezone.utc) > stored_data["expires_at"]:
        otp_store.pop(data.email, None)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mã OTP đã hết hạn... Vui lòng lấy lại mã mới."
        )

    # Kiểm tra mã OTP có chính xác không
    if stored_data["otp"] != data.otp.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mã OTP không chính xác..."
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
    otp_store.pop(data.email, None)

    return new_user


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
):
    # API Đăng nhập lấy JWT Access Token (Tương thích với Swagger Authorize)
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
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/forgot-password/send-otp", status_code=status.HTTP_200_OK)
async def forgot_password_send_otp(data: ForgotPasswordSendOTPRequest, db: Session = Depends(get_db)):
    # Kiểm tra email có tồn tại trong database không
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email này chưa được đăng ký trong hệ thống."
        )

    # Tạo mã OTP 6 chữ số & lưu thời hạn 5 phút
    otp_code = f"{random.randint(100000, 999999)}"
    reset_otp_store[data.email] = {
        "otp": otp_code,
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=5)
    }

    # Gửi email OTP
    success = await send_reset_password_otp_email(data.email, otp_code)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại sau."
        )

    return {"message": "Mã OTP khôi phục mật khẩu đã được gửi thành công!"}


@router.post("/forgot-password/reset", status_code=status.HTTP_200_OK)
def forgot_password_reset(data: ForgotPasswordResetRequest, db: Session = Depends(get_db)):
    # Kiểm tra OTP tồn tại
    stored_data = reset_otp_store.get(data.email)
    if not stored_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mã OTP không tồn tại hoặc chưa được gửi."
        )

    # Kiểm tra hết hạn
    if datetime.now(timezone.utc) > stored_data["expires_at"]:
        reset_otp_store.pop(data.email, None)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mã OTP đã hết hạn. Vui lòng lấy lại mã mới."
        )

    # Kiểm tra OTP đúng
    if stored_data["otp"] != data.otp.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mã OTP không chính xác."
        )

    # Validate mật khẩu mới
    if not is_valid_password(data.new_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mật khẩu mới phải từ 8 ký tự, bao gồm cả chữ và số/ký tự đặc biệt."
        )

    # Cập nhật mật khẩu trong DB
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Người dùng không tồn tại.")

    user.hashed_password = get_password_hash(data.new_password)
    db.commit()

    # Xóa OTP đã dùng
    reset_otp_store.pop(data.email, None)

    return {"message": "Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay."}