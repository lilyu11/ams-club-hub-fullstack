import asyncio
from datetime import datetime, timezone, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from app.core.database import SessionLocal
from app.models.reminder import Reminder
from app.services.email_service import send_reminder_email

scheduler = BackgroundScheduler()


def check_and_send_pending_reminders():
	db = SessionLocal()
	try:
		now_utc = datetime.now(timezone.utc)

		pending_reminders = db.query(Reminder).filter(
			Reminder.is_sent == False,
			Reminder.scheduled_at <= now_utc
		).all()

		if not pending_reminders:
			return

		print(f"🔍 [Scheduler] Phát hiện {len(pending_reminders)} nhắc nhở cần gửi mail...")

		tasks = []
		reminders_to_process = []

		for reminder in pending_reminders:
			user = reminder.user
			post = reminder.campaign_post
			club = post.club if post else None

			if user and post:
				deadline_format = post.deadline.strftime("%H:%M - %d/%m/%Y") if post.deadline else "Đang cập nhật"
				club_name = club.name if club else "AmsClubHub"

				# Khai báo Coroutine (Chưa cho chạy ngay)
				coro = send_reminder_email(
					to_email=user.email,
					user_name=user.full_name,
					post_title=post.title,
					club_name=club_name,
					email_message=post.email_message,
					action_url=post.action_url or post.fb_post_url
				)
				tasks.append(coro)
				reminders_to_process.append(reminder)

		# Chạy song song tất cả các mail bất đồng bộ trong Event Loop
		async def run_batch_emails():
			return await asyncio.gather(*tasks, return_exceptions=True)

		if tasks:
			# Thực thi toàn bộ danh sách gửi mail cùng lúc
			results = asyncio.run(run_batch_emails())

			# Đối chiếu kết quả trả về để đánh dấu is_sent
			for reminder, result in zip(reminders_to_process, results):
				if result is True:
					reminder.is_sent = True

		db.commit()

	except Exception as e:
		print(f"❌ [Scheduler Error]: {str(e)}")
		db.rollback()
	finally:
		db.close()


def cleanup_old_reminders():
	# Hàm chạy ngầm 24h/lần để xóa bớt dữ liệu cũ/quá hạn
	db = SessionLocal()
	try:
		now_utc = datetime.now(timezone.utc)

		deleted_count = db.query(Reminder).filter(
			(Reminder.is_sent == True) & (Reminder.scheduled_at < now_utc - timedelta(days=3))
			| (Reminder.is_sent == False) & (Reminder.scheduled_at < now_utc - timedelta(days=1))
		).delete(synchronize_session=False)

		db.commit()
		if deleted_count > 0:
			print(f"🧹 [Cleanup Job] Đã dọn dẹp {deleted_count} nhắc nhở cũ/quá hạn khỏi database.")
	except Exception as e:
		print(f"❌ [Cleanup Error]: {str(e)}")
		db.rollback()
	finally:
		db.close()


def start_scheduler():
	# Chạy Cron Job gửi mail mỗi 5 phút (Tối đa 1 instance chạy đồng thời)
	scheduler.add_job(
		check_and_send_pending_reminders,
		'interval',
		minutes=5,
		id="reminder_job",
		replace_existing=True,
		max_instances=1
	)
	
	# Chạy Cron Job dọn dẹp DB mỗi ngày lúc 00:00
	scheduler.add_job(
		cleanup_old_reminders,
		'cron',
		hour=0,
		minute=0,
		id="cleanup_job",
		replace_existing=True
	)
	
	scheduler.start()
	print("🚀 APScheduler đã khởi động (Quét reminder gửi mỗi 5 phút & dọn dẹp hàng ngày)...")