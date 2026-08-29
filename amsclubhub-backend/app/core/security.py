import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Any, Union
from jose import jwt
from app.core.config import settings

ALGORITHM = "HS256"


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
	
	to_encode = {"exp": expire, "sub": str(subject)}
	encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
	return encoded_jwt
