from datetime import datetime, timedelta, timezone
from typing import Any, Union
from jose import jwt
from passlib.context import CryptContext
from app.core.config import settings

# Khởi tạo context cho Bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = "HS256"


def verify_password(plain_password: str, hashed_password: str) -> bool:
	try:
		# Cắt 72 bytes chuẩn UTF-8 để tương thích với tất cả phiên bản bcrypt trên Render
		safe_password = plain_password.encode('utf-8')[:72].decode('utf-8', errors='ignore')
		return pwd_context.verify(safe_password, hashed_password)
	except Exception as e:
		print(f"Lỗi verify: {e}")
		return False


def get_password_hash(password: str) -> str:
	# Băm mật khẩu thành chuỗi Bcrypt Hash an toàn
	return pwd_context.hash(password)


def create_access_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
	# Tạo JWT Token chứa user_id (subject) và thời gian hết hạn 
	if expires_delta:
		expire = datetime.now(timezone.utc) + expires_delta
	else:
		expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
	
	to_encode = {"exp": expire, "sub": str(subject)}
	encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
	return encoded_jwt
