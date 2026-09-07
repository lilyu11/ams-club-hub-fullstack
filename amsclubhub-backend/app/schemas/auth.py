from pydantic import BaseModel, ConfigDict, EmailStr
from typing import Optional
from app.models.user import UserRole


# Schema nhận dữ liệu đăng ký (register)
class UserRegister(BaseModel):
	email: EmailStr
	password: str
	full_name: str
	student_id: Optional[str] = None
	role: Optional[UserRole] = UserRole.STUDENT


# Schema nhận dữ liệu đăng nhập (log in)
class UserLogin(BaseModel):
	email: EmailStr
	password: str


# Schema trả về token sau khi đăng nhập thành công
class Token(BaseModel):
	access_token: str
	token_type: str = "bearer"


# Schema trả về access + refresh token (cho login/register)
class TokenResponse(BaseModel):
	access_token: str
	refresh_token: str
	token_type: str = "bearer"


# Schema request refresh token
class RefreshTokenRequest(BaseModel):
	refresh_token: str


# Schema trả về thông tin user gọn nhẹ
class UserResponse(BaseModel):
	model_config = ConfigDict(from_attributes=True)

	id: str
	email: EmailStr
	full_name: str
	student_id: Optional[str] = None
	role: UserRole
	is_active: bool
	club_id: Optional[str] = None
	club_slug: Optional[str] = None
