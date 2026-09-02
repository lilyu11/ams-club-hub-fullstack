import os
from app.services.scheduler_service import start_scheduler, scheduler
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from app.core.database import engine, Base
from app.core.redis import init_redis, close_redis
from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.clubs import router as clubs_router
from app.api.v1.campaign_posts import router as campaign_posts_router
from app.api.v1.upload import router as upload_router
from app.api.v1.reminders import router as reminders_router

import app.models  # Import để SQLAlchemy nạp toàn bộ Models vào RAM
Base.metadata.create_all(bind=engine) # Tự động tạo các bảng còn thiếu trong DB khi server chạy

@asynccontextmanager
async def lifespan(app: FastAPI):
	# Khởi chạy Redis
	await init_redis()
	# Khởi chạy Scheduler khi app bật
	start_scheduler()
	yield
	# Tắt Scheduler khi app dừng
	scheduler.shutdown()
	# Đóng Redis
	await close_redis()

app = FastAPI(
	title="AmsClubHub API",
	 version="1.0.0",
	description="Backend API cho Hệ thống Quản lý và Quảng bá CLB",
	lifespan=lifespan
)

# Khai báo domain CORS để cho phép Frontend (React / Vue / Flutter Web) truy cập API
origins = [
	"http://localhost:3000",    # React / Next.js mặc định
	"http://localhost:5173",    # Vite (React / Vue) mặc định
	"https://ams-club-hub.hadung29112009.workers.dev",  # Cloudflare Workers (production)
]

# Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
	response = await call_next(request)
	# Security headers
	response.headers["X-Content-Type-Options"] = "nosniff"
	response.headers["X-Frame-Options"] = "DENY"
	response.headers["X-XSS-Protection"] = "1; mode=block"
	response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
	# CSP - cho phép inline scripts/styles cho Swagger UI và frontend
	response.headers["Content-Security-Policy"] = (
		"default-src 'self'; "
		"script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
		"style-src 'self' 'unsafe-inline'; "
		"img-src 'self' data: https:; "
		"font-src 'self' data:; "
		"connect-src 'self' https:; "
		"frame-ancestors 'none'; "
		"base-uri 'self'; "
		"form-action 'self'"
	)
	# HSTS (chỉ bật khi dùng HTTPS)
	if request.url.scheme == "https":
		response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
	return response

# TÍCH HỢP CORS MIDDLEWARE VÀO FASTAPI
app.add_middleware(
	CORSMiddleware,
	allow_origins=origins,            # Cho phép danh sách origin trên
	allow_credentials=True,           # Cho phép gửi Auth Header (JWT Bearer Token) & Cookie
	allow_methods=["*"],              # Cho phép tất cả HTTP Methods (GET, POST, PUT, DELETE, OPTIONS,...)
	allow_headers=["*"],              # Cho phép tất cả Headers
)

# Đảm bảo thư mục Uploads tồn tại
UPLOAD_DIR = "uploads/images"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Mount thư mục Static để truy cập ảnh qua URL
app.mount("/static/images", StaticFiles(directory=UPLOAD_DIR), name="static_images")

# Tích hợp Router
app.include_router(auth_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(clubs_router, prefix="/api/v1")
app.include_router(campaign_posts_router, prefix="/api/v1")
app.include_router(upload_router, prefix="/api/v1")
app.include_router(reminders_router, prefix="/api/v1")


@app.get("/")
def root():
	return {"message": "Welcome to AmsClubHub API!"}
