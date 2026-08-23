import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.core.database import Base


class Reminder(Base):
	__tablename__ = "reminders"

	id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
	user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
	campaign_post_id = Column(String(36), ForeignKey("campaign_posts.id", ondelete="CASCADE"), nullable=False)
	scheduled_at = Column(DateTime, nullable=False)
	is_sent = Column(Boolean, default=False, nullable=False)
	created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

	# ĐÃ THÊM: Đánh chỉ mục (Index) cho 2 trường thường xuyên dùng để query
	__table_args__ = (
		Index("idx_reminder_pending", "is_sent", "scheduled_at"),
	)

	# Relationships
	user = relationship("User", back_populates="reminders")
	campaign_post = relationship("CampaignPost", back_populates="reminders")