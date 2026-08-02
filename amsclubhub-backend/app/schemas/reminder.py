from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.schemas.campaign_post import CampaignPostResponse


class ReminderResponse(BaseModel):
	id: str
	user_id: str
	campaign_post_id: str
	scheduled_at: datetime
	is_sent: bool
	created_at: datetime
	campaign_post: Optional[CampaignPostResponse] = None


	model_config = ConfigDict(from_attributes=True)