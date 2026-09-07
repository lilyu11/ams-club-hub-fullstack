from datetime import datetime, timedelta, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.campaign_post import CampaignPost
from app.models.reminder import Reminder
from app.schemas.reminder import ReminderResponse, ReminderPreferences

router = APIRouter(tags=["Reminders"])


# Đặt nhắc nhở cho bài viết
@router.post("/posts/{post_id}/remind", status_code=status.HTTP_201_CREATED)
def create_reminder(
	post_id: str,
	db: Session = Depends(get_db),
	current_user: User = Depends(get_current_user)
):
	"""
	**Đặt nhắc nhở cho bài viết**

	- Tự động hẹn gửi mail trước deadline 24h
	- Nếu bài viết còn dưới 24h nữa là hết hạn, hệ thống sẽ gửi mail ngay lập tức
	"""
	post = db.query(CampaignPost).filter(CampaignPost.id == post_id).first()
	if not post:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail="Không tìm thấy bài viết."
		)

	if not post.deadline:
		raise HTTPException(
			status_code=status.HTTP_400_BAD_REQUEST,
			detail="Bài viết này không có Deadline nên không thể đặt nhắc nhở."
		)

	# Dùng naive UTC nhất quán với scheduler comparison
	now_utc_naive = datetime.now(timezone.utc).replace(tzinfo=None)

	# Đảm bảo deadline là naive để so sánh đúng (deadline từ frontend là naive local time)
	post_deadline = post.deadline
	if post_deadline.tzinfo is not None:
		post_deadline = post_deadline.replace(tzinfo=None)

	if post_deadline <= now_utc_naive:
		raise HTTPException(
			status_code=status.HTTP_400_BAD_REQUEST,
			detail="Bài viết này đã hết hạn (Deadline đã trôi qua)."
		)

	# Kiểm tra trùng lặp
	existing_reminder = db.query(Reminder).filter(
		Reminder.user_id == current_user.id,
		Reminder.campaign_post_id == post_id
	).first()

	if existing_reminder:
		raise HTTPException(
			status_code=status.HTTP_400_BAD_REQUEST,
			detail="Bạn đã đặt nhắc nhở cho bài viết này rồi."
		)

	# Tính thời điểm gửi mail (Mặc định là deadline trong post)
	scheduled_time = post_deadline

	new_reminder = Reminder(
		user_id=current_user.id,
		campaign_post_id=post_id,
		scheduled_at=scheduled_time
	)

	db.add(new_reminder)
	db.commit()
	db.refresh(new_reminder)

	return {
		"message": "Đã đặt nhắc nhở thành công! Hệ thống sẽ gửi Email nhắc nhở bạn.",
		"scheduled_at": new_reminder.scheduled_at
	}


# Hủy nhắc nhở bài viết
@router.delete("/posts/{post_id}/remind")
def delete_reminder(
	post_id: str,
	db: Session = Depends(get_db),
	current_user: User = Depends(get_current_user)
):
	"""Hủy nhắc nhở bài viết."""
	reminder = db.query(Reminder).filter(
		Reminder.user_id == current_user.id,
		Reminder.campaign_post_id == post_id
	).first()

	if not reminder:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail="Bạn chưa đặt nhắc nhở cho bài viết này."
		)

	db.delete(reminder)
	db.commit()
	return {"message": "Đã hủy nhắc nhở thành công."}


# Xem danh sách các bài viết mà người dùng đã đặt nhắc nhở
@router.get("/reminders/me", response_model=List[ReminderResponse])
def get_my_reminders(
	db: Session = Depends(get_db),
	current_user: User = Depends(get_current_user)
):
	"""Lấy danh sách các bài viết mà người dùng hiện tại đã đặt nhắc nhở."""
	return db.query(Reminder).options(
		joinedload(Reminder.campaign_post)
	).filter(
		Reminder.user_id == current_user.id
	).order_by(Reminder.created_at.desc()).all()


# Xem tùy chọn Auto-Reminder của người dùng
@router.get("/reminders/preferences")
def get_reminder_preferences(
	db: Session = Depends(get_db),
	current_user: User = Depends(get_current_user)
):
	"""Lấy tùy chọn tự động đặt nhắc nhở của người dùng."""
	return {"auto_reminder": bool(current_user.auto_reminder)}


# Cập nhật tùy chọn Auto-Reminder của người dùng
@router.put("/reminders/preferences")
def update_reminder_preferences(
	payload: ReminderPreferences,
	db: Session = Depends(get_db),
	current_user: User = Depends(get_current_user)
):
	"""Bật/tắt tự động đặt nhắc nhở. Hệ thống sẽ tạo reminder tự động cho các bài viết có deadline."""
	current_user.auto_reminder = payload.auto_reminder
	db.commit()
	return {"auto_reminder": bool(current_user.auto_reminder)}