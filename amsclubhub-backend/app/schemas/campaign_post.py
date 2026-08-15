from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
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
	image_url: Optional[str] = None


# Schema dữ liệu bài viết trả về cho client
class CampaignPostResponse(CampaignPostBase):
	id: str
	club_id: str
	created_at: datetime

model_config = ConfigDict(from_attributes=True)