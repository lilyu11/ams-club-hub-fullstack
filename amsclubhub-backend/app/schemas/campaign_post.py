from pydantic import BaseModel, ConfigDict, field_serializer
from typing import Optional
from datetime import datetime, timezone
from app.models.campaign_post import PostType


# Schema cơ sở cho bài viết
class CampaignPostBase(BaseModel):
	type: PostType = PostType.POST
	title: str
	content: str
	fb_post_url: Optional[str] = None
	image_url: Optional[str] = None
	action_url: Optional[str] = None
	deadline: Optional[datetime] = None


# Schema nhận dữ liệu khi tạo bài viết
class CampaignPostCreate(CampaignPostBase):
	pass


# Schema nhận dữ liệu khi cập nhật bài viết
class CampaignPostUpdate(BaseModel):
	title: Optional[str] = None
	content: Optional[str] = None
	fb_post_url: Optional[str] = None
	image_url: Optional[str] = None
	action_url: Optional[str] = None
	deadline: Optional[str] = None


# Schema dữ liệu bài viết trả về cho client
class CampaignPostResponse(CampaignPostBase):
	model_config = ConfigDict(from_attributes=True)

	id: str
	club_id: str
	created_at: Optional[datetime] = None

	@field_serializer("created_at", "deadline")
	@staticmethod
	def serialize_datetime(v: Optional[datetime]) -> Optional[str]:
		"""Đảm bảo datetime luôn trả về ISO8601 với 'Z' (UTC) để frontend parse đúng."""
		if v is None:
			return None
		if v.tzinfo is None:
			v = v.replace(tzinfo=timezone.utc)
		return v.isoformat().replace("+00:00", "Z")