import asyncio
from datetime import datetime, timezone, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from app.core.database import SessionLocal
from app.models.reminder import Reminder
from app.models.campaign_post import CampaignPost
from app.models.club import ClubFollower
from app.models.user import UserRole
from app.services.email_service import send_reminder_email
from sqlalchemy import text

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


def sync_auto_reminders():
	# Hệ thống chủ động tạo reminder cho bài đăng có deadline còn trong tương lai,
	# cho mọi follower (student, đã bật auto_reminder) của CLB sở hữu bài — KHÔNG phụ thuộc user mở trang.
	# Dùng set-based SQL thay vì vòng lặp Python để tránh O(posts × followers) round-trip tới DB remote.
	db = SessionLocal()
	try:
		now_utc_naive = datetime.now(timezone.utc).replace(tzinfo=None)

		# deadline lưu dạng naive-UTC → lọc bằng Python để không phụ thuộc timezone session của DB
		future_posts = [
			p for p in db.query(CampaignPost).filter(
				CampaignPost.deadline.isnot(None),
				CampaignPost.is_active == True
			).all()
			if p.deadline and p.deadline > now_utc_naive
		]

		created = 0
		for post in future_posts:
			# 1 câu INSERT...SELECT cho toàn bộ follower hợp lệ của CLB, tránh reminder trùng lặp
			result = db.execute(text(
				"""
				INSERT INTO reminders (id, user_id, campaign_post_id, scheduled_at, created_at)
				SELECT gen_random_uuid()::varchar(36), cf.user_id, :post_id, :deadline, now()
				FROM club_followers cf
				JOIN users u ON u.id = cf.user_id
				WHERE cf.club_id = :club_id
					AND u.is_active = TRUE
					AND u.auto_reminder = TRUE
					AND u.role NOT IN ('club_admin', 'super_admin')
					AND NOT EXISTS (
						SELECT 1 FROM reminders r
						WHERE r.user_id = cf.user_id
							AND r.campaign_post_id = :post_id
					)
				"""
			), {"post_id": post.id, "club_id": post.club_id, "deadline": post.deadline})
			created += result.rowcount if result.rowcount else 0

		# Đồng bộ lại scheduled_at nếu deadline của bài hoạt động đã bị sửa (chỉ khi reminder chưa gửi)
		updated = db.execute(text(
			"""
			UPDATE reminders r
			SET scheduled_at = p.deadline
			FROM campaign_posts p
			WHERE p.id = r.campaign_post_id
				AND p.is_active = TRUE
				AND p.deadline IS NOT NULL
				AND p.deadline > :now
				AND r.is_sent = FALSE
				AND r.scheduled_at IS DISTINCT FROM p.deadline
			"""
		), {"now": now_utc_naive}).rowcount or 0

		db.commit()
		if created or updated:
			print(f"🤖 [Auto-Reminder] Đã tạo {created} và cập nhật {updated} nhắc nhở tự động.")
	except Exception as e:
		print(f"❌ [Auto-Reminder Error]: {str(e)}")
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

	# Chạy Cron Job tự tạo reminder cho follower (auto_reminder bật) mỗi 10 phút
	scheduler.add_job(
		sync_auto_reminders,
		'interval',
		minutes=10,
		id="auto_reminder_sync",
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
	print(f"🚀 APScheduler đã khởi động với jobs: {[job.id for job in scheduler.get_jobs()]}")