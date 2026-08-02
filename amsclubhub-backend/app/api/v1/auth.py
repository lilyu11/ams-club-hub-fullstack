from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.user import User
from app.schemas.auth import UserRegister, UserLogin, Token, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
	# API Đăng ký tài khoản mới
	# Kiểm tra email đã tồn tại chưa
	existing_user = db.query(User).filter(User.email == user_in.email).first()
	if existing_user:
		raise HTTPException(
		status_code=status.HTTP_400_BAD_REQUEST,
		detail="Email này đã được sử dụng trong hệ thống."
		)

	# Hash mật khẩu và tạo user mới
	hashed_pwd = get_password_hash(user_in.password)
	new_user = User(
	email=user_in.email,
	hashed_password=hashed_pwd,
	full_name=user_in.full_name,
	student_id=user_in.student_id,
	role=user_in.role
	)

	db.add(new_user)
	db.commit()
	db.refresh(new_user)
	return new_user


@router.post("/login", response_model=Token)
def login(
	# Sử dụng Data Form cho Authorize
	form_data: OAuth2PasswordRequestForm = Depends(), 
	db: Session = Depends(get_db)):
	# API Đăng nhập lấy JWT Access Token (Tương thích với Swagger Authorize)
	# OAuth2PasswordRequestForm sẽ nhận "username" (email) và "password"
	user = db.query(User).filter(User.email == form_data.username).first()

	if not user or not verify_password(form_data.password, user.hashed_password):
		raise HTTPException(
		status_code=status.HTTP_401_UNAUTHORIZED,
		detail="Email hoặc mật khẩu không chính xác.",
		headers={"WWW-Authenticate": "Bearer"},
		)

	if not user.is_active:
		raise HTTPException(
		status_code=status.HTTP_400_BAD_REQUEST,
		detail="Tài khoản này hiện đang bị khóa."
		)

	# Tạo token chứa ID người dùng (user id)
	access_token = create_access_token(subject=user.id)
	return {"access_token": access_token, "token_type": "bearer"}
