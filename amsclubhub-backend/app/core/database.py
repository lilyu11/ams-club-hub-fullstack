from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# Tạo SQLAlchemy Engine
engine = create_engine(
	settings.DATABASE_URL,
	pool_pre_ping=True,  # Tự động kiểm tra và kết nối lại nếu DB bị ngắt
	pool_size=10,               # Số connection giữ sẵn (kết nối remote Supabase nên dự phòng nhiều hơn default 5)
	max_overflow=15,            # Connection vượt trần tạm thời trước khi chờ pool
	pool_timeout=20,            # Giảm thời gian chờ khi pool cạn (default 30s)
	pool_recycle=1800,          # Tái tạo connection sau 30 phút — dưới giới hạn idle của Supabase
	connect_args={"sslmode": "require"} if settings.DATABASE_URL.startswith("postgres") else {},
	)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class cho tất cả các ORM Models kế thừa
Base = declarative_base()


def get_db() -> Generator:
	# Dependency cung cấp Database Session cho API endpoints
	db = SessionLocal()
	try:
		yield db
	finally:
		db.close()
