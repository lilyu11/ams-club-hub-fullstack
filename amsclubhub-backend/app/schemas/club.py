from pydantic import BaseModel, ConfigDict, field_serializer
from typing import Optional
from datetime import datetime, timezone


# Schema cơ sở cho Club
class ClubBase(BaseModel):
	name: str
	code: str
	category: Optional[str] = None
	signature: Optional[str] = None
	description: Optional[str] = None
	logo_url: Optional[str] = None
	banner_url: Optional[str] = None
	facebook_url: Optional[str] = None
	contact_email: Optional[str] = None
	follower_count: Optional[str] = None
	is_active: Optional[bool] = True


# Schema nhận dữ liệu khi tạo CLB mới
class ClubCreate(ClubBase):
		pass


# Schema nhận dữ liệu khi cập nhật CLB
class ClubUpdate(BaseModel):
	name: Optional[str] = None
	code: Optional[str] = None
	category: Optional[str] = None
	signature: Optional[str] = None
	description: Optional[str] = None
	logo_url: Optional[str] = None
	banner_url: Optional[str] = None
	facebook_url: Optional[str] = None
	contact_email: Optional[str] = None
	follower_count: Optional[str] = None
	is_active: Optional[bool] = None


# Schema dữ liệu trả về cho client
class ClubResponse(ClubBase):
	model_config = ConfigDict(from_attributes=True)

	id: str
	is_active: bool
	created_at: datetime
	admin_id: str

	@field_serializer("created_at")
	@staticmethod
	def serialize_datetime(v: datetime) -> str:
		if v.tzinfo is None:
			v = v.replace(tzinfo=timezone.utc)
		return v.isoformat().replace("+00:00", "Z")

# Schema confirm vô hiệu hóa CLB
class ClubDeleteConfirm(BaseModel):
	password: str

# Schema trạng thái follow
class ClubFollowResponse(BaseModel):
	model_config = ConfigDict(from_attributes=True)

	message: str
	is_following: bool
	followers_count: int
