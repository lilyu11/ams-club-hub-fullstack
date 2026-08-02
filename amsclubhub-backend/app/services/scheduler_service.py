from datetime import datetime, timezone
from apscheduler.schedulers.background import BackgroundScheduler
from app.core.database import SessionLocal
from app.models.reminder import Reminder
from app.services.email_service import send_reminder_email

scheduler = BackgroundScheduler()


def check_and_send_pending_reminders():
	# Hàm chạy ngầm quét danh sách reminders tới giờ gửi
	db = SessionLocal()
	try:
		now_utc = datetime.now(timezone.utc)

		# Tìm các reminder chưa gửi và scheduled_at (giờ hiện tại)
		pending_reminders = db.query(Reminder).filter(
			Reminder.is_sent == False,
			Reminder.scheduled_at <= now_utc
		).all()

		if not pending_reminders:
			return

		print(f"🔍 [Scheduler] Phát hiện {len(pending_reminders)} nhắc nhở cần gửi mail...")

		for reminder in pending_reminders:
			user = reminder.user
			post = reminder.campaign_post
			club = post.club if post else None

			if user and post:
				deadline_format = post.deadline.strftime("%H:%M - %d/%m/%Y") if post.deadline else "Đang cập nhật"
				club_name = club.name if club else "CLB"

				success = send_reminder_email(
					to_email=user.email,
					user_name=user.full_name,
					post_title=post.title,
					club_name=club_name,
					deadline_str=deadline_format,
					action_url=post.action_url or post.fb_post_url
				)

				if success:
					reminder.is_sent = True

		db.commit()
	except Exception as e:
		print(f"❌ [Scheduler Error]: {str(e)}")
		db.rollback()
	finally:
		db.close()


def start_scheduler():
	# Bắt đầu chạy Cron Job mỗi 5 phút một lần
	# Chạy hàm check mỗi 5 phút
	scheduler.add_job(check_and_send_pending_reminders, 'interval', minutes=5, id="reminder_job", replace_existing=True)
	scheduler.start()
	print("🚀 APScheduler đã khởi động (Chạy quét Email nhắc nhở mỗi 5 phút)...")