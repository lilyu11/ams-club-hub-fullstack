from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import ALGORITHM
from app.models.user import User

# OAuth2 Scheme giúp Swagger UI xuất hiện nút "Authorize"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_current_user(
	db: Session = Depends(get_db),
	token: str = Depends(oauth2_scheme)
) -> User:
	# Dependency đọc token từ Header, giải mã và trả về thông tin user
	credentials_exception = HTTPException(
		status_code=status.HTTP_401_UNAUTHORIZED,
		detail="Token không hợp lệ hoặc đã hết hạn.",
		headers={"WWW-Authenticate": "Bearer"},
	)
	try:
		# Giải mã JWT Token bằng SECRET_KEY
		payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
		user_id: str = payload.get("sub")
		if user_id is None:
			raise credentials_exception
	except JWTError:
		raise credentials_exception

	# Tìm User trong Database theo ID
	user = db.query(User).filter(User.id == user_id).first()
	if user is None:
		raise credentials_exception

	if not user.is_active:
		raise HTTPException(
			status_code=status.HTTP_400_BAD_REQUEST,
			detail="Tài khoản này hiện đang bị khóa."
	)

	return user