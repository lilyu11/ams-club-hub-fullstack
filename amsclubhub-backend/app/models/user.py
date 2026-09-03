import uuid
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, String, DateTime, Enum as SQLEnum, Boolean, func
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import timezone


class UserRole(str, Enum):
	STUDENT = "student"
	CLUB_ADMIN = "club_admin"
	SUPER_ADMIN = "super_admin"


class User(Base):
	__tablename__ = "users"

	# Primary Key hệ thống (UUID36)
	id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
	
	# Mã số học sinh (Dùng cho nghiệp vụ trường học)
	student_id = Column(String(50), unique=True, nullable=True, index=True)
	
	# Thông tin tài khoản
	email = Column(String(255), unique=True, nullable=False, index=True)
	hashed_password = Column(String(255), nullable=False)
	full_name = Column(String(100), nullable=False)
	role = Column(SQLEnum(UserRole, name="userrole"), default=UserRole.STUDENT, nullable=False)
	phone_number = Column(String(20), nullable=True)
	is_active = Column(Boolean, default=True, nullable=False)
	created_at = Column(DateTime, server_default=func.now(), nullable=False)

	# Relationships
	clubs = relationship("Club", back_populates="admin")
	followed_clubs = relationship("ClubFollower", back_populates="user")
	reminders = relationship("Reminder", back_populates="user", cascade="all, delete-orphan")
