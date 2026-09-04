from datetime import datetime, timedelta, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.campaign_post import CampaignPost
from app.models.reminder import Reminder
from app.schemas.reminder import ReminderResponse

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

	now_utc = datetime.now(timezone.utc)
	
	# Đảm bảo so sánh datetime cùng timezone
	post_deadline = post.deadline
	if post_deadline.tzinfo is None:
		post_deadline = post_deadline.replace(tzinfo=timezone.utc)

	if post_deadline <= now_utc:
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
	return db.query(Reminder).filter(
		Reminder.user_id == current_user.id
	).order_by(Reminder.created_at.desc()).all()