import uuid
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, String, Text, DateTime, Boolean, Integer, ForeignKey, Index, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import timezone


class PostType(str, Enum):
	POST = "POST"            # Bài đăng
	EVENT = "EVENT"            # Sự kiện


class CampaignPost(Base):
	__tablename__ = "campaign_posts"
	# Index hỗ trợ truy vấn bài viết theo club_id (thường xuyên truy vấn nhất)
	__table_args__ = (
		Index("ix_campaign_posts_club_id", "club_id"),
	)

	id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
	club_id = Column(String(36), ForeignKey("clubs.id", ondelete="CASCADE"), nullable=False)
	
	type = Column(SQLEnum(PostType), nullable=False, default="POST")
	title = Column(String(200), nullable=False)
	content = Column(Text, nullable=False)
	fb_post_url = Column(String(500), nullable=True)       # Link bài gốc trên Facebook
	image_url = Column(String(500), nullable=True)         # Ảnh poster / banner bài viết
	action_url = Column(String(500), nullable=True)        # Link form đăng ký / mua hàng
	deadline = Column(DateTime, nullable=True)             # Hạn chót đóng đơn
	
	is_active = Column(Boolean, default=True, nullable=False)
	click_count = Column(Integer, default=0, nullable=False)
	created_at = Column(DateTime, default=datetime.now(timezone.utc), nullable=False)

	# Relationships
	club = relationship("Club", back_populates="campaign_posts")
	reminders = relationship("Reminder", back_populates="campaign_post", cascade="all, delete-orphan")
