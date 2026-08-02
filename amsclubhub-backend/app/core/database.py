from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# Tạo SQLAlchemy Engine
engine = create_engine(
	settings.DATABASE_URL,
	pool_pre_ping=True,  # Tự động kiểm tra và kết nối lại nếu DB bị ngắt
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
