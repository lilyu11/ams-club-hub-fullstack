from datetime import datetime, timedelta, timezone
from typing import Any, Union
from jose import jwt
from passlib.context import CryptContext
from app.core.config import settings

# Khởi tạo context cho Bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = "HS256"


def verify_password(plain_password: str, hashed_password: str) -> bool:
	# Kiểm tra mật khẩu user nhập có khớp với Hash trong DB không
	return pwd_context.verify(plain_password, hashed_password)


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
