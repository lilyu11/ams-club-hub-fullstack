from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


# Schema cơ sở cho Club
class ClubBase(BaseModel):
	name: str
	code: str
	category: Optional[str] = None
	description: Optional[str] = None
	logo_url: Optional[str] = None
	banner_url: Optional[str] = None
	facebook_url: Optional[str] = None
	contact_email: Optional[str] = None
	is_active: Optional[bool] = True


# Schema nhận dữ liệu khi tạo CLB mới
class ClubCreate(ClubBase):
		pass


# Schema nhận dữ liệu khi cập nhật CLB
class ClubUpdate(BaseModel):
	name: Optional[str] = None
	category: Optional[str] = None
	code: Optional[str] = None
	description: Optional[str] = None
	logo_url: Optional[str] = None
	banner_url: Optional[str] = None
	facebook_url: Optional[str] = None
	contact_email: Optional[str] = None
	is_active: Optional[bool] = None


# Schema dữ liệu trả về cho client
class ClubResponse(ClubBase):
	id: str
	is_active: bool
	created_at: datetime
	admin_id: str

# Schema confirm vô hiệu hóa CLB
class ClubDeleteConfirm(BaseModel):
	password: str

# Schema trạng thái follow
class ClubFollowResponse(BaseModel):
	message: str
	is_following: bool 
	followers_count: int

model_config = ConfigDict(from_attributes=True)
