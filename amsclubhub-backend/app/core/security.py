import bcrypt
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Union
from jose import jwt
from app.core.config import settings
from app.core.redis import get_redis

ALGORITHM = "HS256"
REFRESH_TOKEN_EXPIRE_DAYS = 30


def verify_password(plain_password: str, hashed_password: str) -> bool:
	try:
		# Chuyển plain_password thành bytes & giới hạn đúng 72 bytes
		pwd_bytes = plain_password.encode('utf-8')[:72]

		# Chuyển hash từ DB thành bytes
		hashed_bytes = hashed_password.encode('utf-8')

		# Dùng bcrypt gốc kiểm tra
		return bcrypt.checkpw(pwd_bytes, hashed_bytes)
	except Exception as e:
		print(f"Lỗi verify password: {e}")
		return False


def get_password_hash(password: str) -> str:
	pwd_bytes = password.encode('utf-8')[:72]
	salt = bcrypt.gensalt()
	hashed = bcrypt.hashpw(pwd_bytes, salt)
	return hashed.decode('utf-8')


def create_access_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
	if expires_delta:
		expire = datetime.now(timezone.utc) + expires_delta
	else:
		expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

	to_encode = {"exp": expire, "sub": str(subject), "type": "access"}
	encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
	return encoded_jwt


def create_refresh_token(subject: Union[str, Any]) -> tuple[str, str]:
    """
    Tạo refresh token ngẫu nhiên an toàn.
    Returns: (refresh_token_plain, refresh_token_hash)
    - plain: trả về cho client (lưu trong HttpOnly cookie hoặc localStorage)
    - hash: lưu vào Redis để verify
    """
    # Tạo token ngẫu nhiên 32 bytes = 64 hex chars
    refresh_plain = secrets.token_urlsafe(32)
    # Hash để lưu vào Redis (không lưu plain token)
    refresh_hash = hashlib.sha256(refresh_plain.encode()).hexdigest()
    return refresh_plain, refresh_hash


async def store_refresh_token(user_id: str, refresh_hash: str, expires_days: int = REFRESH_TOKEN_EXPIRE_DAYS) -> bool:
    # Lưu refresh token hash vào Redis với TTL
    redis = get_redis()
    if not redis:
        return False
    key = f"refresh:{user_id}:{refresh_hash}"
    # Value lưu timestamp tạo để có thể debug/audit
    import time as _time
    await redis.set(key, str(int(_time.time())), ex=expires_days * 86400)
    return True


async def verify_refresh_token(user_id: str, refresh_plain: str) -> bool:
    # Xác thực refresh token: hash plain token và kiểm tra trong Redis
    redis = get_redis()
    if not redis:
        return False
    refresh_hash = hashlib.sha256(refresh_plain.encode()).hexdigest()
    key = f"refresh:{user_id}:{refresh_hash}"
    exists = await redis.exists(key)
    return exists > 0


async def revoke_refresh_token(user_id: str, refresh_plain: str) -> bool:
    # Xóa refresh token khỏi Redis khi dùng khi rotate hoặc logout
    redis = get_redis()
    if not redis:
        return False
    refresh_hash = hashlib.sha256(refresh_plain.encode()).hexdigest()
    key = f"refresh:{user_id}:{refresh_hash}"
    result = await redis.delete(key)
    return result > 0


async def revoke_all_refresh_tokens(user_id: str) -> int:
    # Xóa tất cả refresh token của user (logout everywhere)
    redis = get_redis()
    if not redis:
        return 0
    pattern = f"refresh:{user_id}:*"
    keys = []
    async for key in redis.scan_iter(match=pattern):
        keys.append(key)
    if keys:
        return await redis.delete(*keys)
    return 0
