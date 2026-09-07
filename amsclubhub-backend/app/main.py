import os
import sqlalchemy as sa
from app.services.scheduler_service import (
	start_scheduler,
	scheduler,
	check_and_send_pending_reminders,
	sync_auto_reminders,
)
import asyncio
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from app.core.database import engine, Base, SessionLocal
from app.core.redis import init_redis, close_redis
from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.clubs import router as clubs_router
from app.api.v1.campaign_posts import router as campaign_posts_router
from app.api.v1.upload import router as upload_router
from app.api.v1.reminders import router as reminders_router

import app.models  # Import để SQLAlchemy nạp toàn bộ Models vào RAM
Base.metadata.create_all(bind=engine) # Tự động tạo các bảng còn thiếu trong DB khi server chạy

# create_all KHÔNG thêm cột mới vào bảng đã có sẵn → đảm bảo cột auto_reminder tồn tại (idempotent)
with engine.begin() as conn:
	conn.execute(sa.text("ALTER TABLE users ADD COLUMN IF NOT EXISTS auto_reminder BOOLEAN NOT NULL DEFAULT TRUE"))
	# Cột slug (URL thân thiện/bảo mật) cho CLB + unique index (Postgres cho phép nhiều NULL trong unique)
	conn.execute(sa.text("ALTER TABLE clubs ADD COLUMN IF NOT EXISTS slug VARCHAR(120)"))
	conn.execute(sa.text("CREATE UNIQUE INDEX IF NOT EXISTS uq_clubs_slug ON clubs(slug)"))


def _backfill_club_slugs():
	# Backfill slug cho CLB chưa có slug - chạy mỗi lần boot, chỉ fill các dòng thiếu (idempotent)
	from app.core.slugify import to_slug
	from app.models.club import Club

	db = SessionLocal()
	try:
		missing = db.query(Club).filter(Club.slug.is_(None)).all()
		if not missing:
			return
		for club in missing:
			base = to_slug(club.name)
			candidate = base
			n = 2
			while db.query(Club.id).filter(Club.slug == candidate, Club.id != club.id).first():
				candidate = f"{base}-{n}"
				n += 1
			club.slug = candidate
		db.commit()
	finally:
		db.close()


_backfill_club_slugs()

# ---------------------------------------------------------------------------
# Backstop cho email reminder — Render free tier có thể làm APScheduler thread
# không chạy đều. Ở đây, mỗi khi có REQUEST chạm vào server, sau khi trả response
# chúng ta lặng lẽ chạy sync+send (tối đa 1 lần/90 giây) để đảm bảo mail vẫn được
# gửi kể cả khi scheduler nền bị "ngủ quên".
# ---------------------------------------------------------------------------
_last_backstop_run = -1e9  # cho phép lần chạy ĐẦU TIÊN luôn được thực thi
_backstop_lock = asyncio.Lock()


async def _run_backstop():
	global _last_backstop_run
	now = asyncio.get_running_loop().time()
	if now - _last_backstop_run < 90:
		return
	async with _backstop_lock:
		if now - _last_backstop_run < 90:
			return
		_last_backstop_run = now
	# Chạy trong thread để không chặn event loop (hàm sync dùng SessionLocal riêng)
	await asyncio.to_thread(sync_auto_reminders)
	await asyncio.to_thread(check_and_send_pending_reminders)
	print("🔥 [Backstop] Đã chạy sync_auto_reminders + check_and_send_pending_reminders do có request.")


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
	"https://amsclubhub.com",  # Cloudflare Workers (production)
]

# Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
	response = await call_next(request)
	# Backstop: sau khi trả response cho người dùng, lặng lẽ chạy reminder sync + send
	# (throttle 90s) phòng khi APScheduler nền không chạy trên Render free tier.
	asyncio.create_task(_run_backstop())
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


@app.api_route("/", methods=["GET", "HEAD"])
def root():
	return {"message": "Welcome to AmsClubHub API!"}


# Chẩn đoán Scheduler - kiểm tra scheduler có đang chạy và có bao nhiêu job + reminder pending
@app.api_route("/api/v1/scheduler/status", methods=["GET", "HEAD"])
def scheduler_status():
	from app.core.database import SessionLocal
	from app.models.reminder import Reminder
	from datetime import datetime, timezone

	jobs = [{"id": j.id, "next_run": str(j.next_run_time)} for j in scheduler.get_jobs()]

	db = SessionLocal()
	try:
		now_utc_naive = datetime.now(timezone.utc).replace(tzinfo=None)
		pending = db.query(Reminder).filter(
			Reminder.is_sent == False,
			Reminder.scheduled_at <= now_utc_naive
		).count()
		unsent_total = db.query(Reminder).filter(Reminder.is_sent == False).count()
		return {
			"scheduler_running": scheduler.running,
			"jobs": jobs,
			"pending_due_now": pending,
			"unsent_total": unsent_total,
		}
	finally:
		db.close()


# Chẩn đoán - chạy ngay vòng gửi mail (chỉ dùng để debug)
@app.api_route("/api/v1/scheduler/run-now", methods=["GET", "HEAD"])
def scheduler_run_now():
	check_and_send_pending_reminders()
	return {"message": "Đã chạy check_and_send_pending_reminders()"}
