import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Boolean, Integer, func
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import timezone


class ClubFollower(Base):
	__tablename__ = "club_followers"

	user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
	club_id = Column(String(36), ForeignKey("clubs.id", ondelete="CASCADE"), primary_key=True)
	created_at = Column(DateTime, server_default=func.now(), nullable=False)

	# Relationships
	user = relationship("User", back_populates="followed_clubs")
	club = relationship("Club", back_populates="followers")


class Club(Base):
	__tablename__ = "clubs"

	id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
	name = Column(String(150), unique=True, nullable=False, index=True)
	code = Column(String(20), unique=True, nullable=False, index=True)
	slug = Column(String(120), unique=True, nullable=True, index=True)
	contact_email = Column(String(150), unique=True, nullable=False, index=True)
	category = Column(String(50), nullable=True)  # Nghệ thuật, Học thuật, Thể thao,...
	description = Column(Text, nullable=True)
	logo_url = Column(String(500), nullable=True)
	banner_url = Column(String(500), nullable=True)
	facebook_url = Column(String(500), nullable=True)
	is_active = Column(Boolean, default=True, nullable=False)
	created_at = Column(DateTime, server_default=func.now(), nullable=False)
	signature = Column(String(50), nullable=True) # Đặc trưng câu lạc bộ
	display_order = Column(Integer, default=0, nullable=False)
	follower_count = Column(String(10), nullable=True)

	# Foreign key liên kết với user quản lý CLB (Club admin)
	admin_id = Column(String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)

	# Relationships
	admin = relationship("User", back_populates="clubs")
	followers = relationship("ClubFollower", back_populates="club")
	campaign_posts = relationship("CampaignPost", back_populates="club", cascade="all, delete-orphan")