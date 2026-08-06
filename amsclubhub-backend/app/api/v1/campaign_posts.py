import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import or_, cast, String
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User, UserRole
from app.models.campaign_post import CampaignPost
from app.api.v1.clubs import get_club_by_identifier
from app.schemas.campaign_post import CampaignPostCreate, CampaignPostUpdate, CampaignPostResponse
from app.models.club import Club

router = APIRouter(tags=["Campaign Posts"])


# Đăng bài viết mới
@router.post("/clubs/{club_identifier}/posts", response_model=CampaignPostResponse, status_code=status.HTTP_201_CREATED)
def create_campaign_post(
	club_identifier: str,
	post_in: CampaignPostCreate,
	db: Session = Depends(get_db),
	current_user: User = Depends(get_current_user)
):
	"""
	**Tạo bài viết mới cho CLB**
	Yêu cầu: Người dùng phải là Club Admin hoặc Super Admin
	"""
	club = get_club_by_identifier(club_identifier, db)

	if club.admin_id != current_user.id and current_user.role != UserRole.SUPER_ADMIN:
		raise HTTPException(
			status_code=status.HTTP_403_FORBIDDEN,
			detail="Bạn không có quyền đăng bài viết cho câu lạc bộ này."
		)

	new_post = CampaignPost(
		**post_in.model_dump(),
		club_id=club.id
	)

	db.add(new_post)
	db.commit()
	db.refresh(new_post)
	return new_post


# Lấy danh sách bài viết dựa trên tìm kiếm
@router.get("/posts", response_model=List[CampaignPostResponse])
def get_campaign_posts(
	club_identifier: Optional[str] = Query(None, description="Lọc bài viết theo ID của CLB"),
	search: Optional[str] = Query(None, description="Tìm kiếm theo tiêu đề bài viết"),
	skip: int = 0,
	limit: int = 20,
	db: Session = Depends(get_db)
):
	"""Lấy bảng tin các bài viết (Newsfeed công khai)"""
	query = db.query(CampaignPost)

	# Lọc CLB theo ID, code hoặc name
	if club_identifier:
		clean_id = str(club_identifier).strip()
		
		# Dùng cast(..., String) để ép tất cả về chuỗi, chống xung đột kiểu dữ liệu trong PostgreSQL
		query = query.join(Club, CampaignPost.club_id == Club.id).filter(
			or_(
				cast(CampaignPost.club_id, String) == clean_id,
				cast(Club.id, String) == clean_id,
				Club.code == clean_id,
				Club.name == clean_id
			)
		)

	if search:
		query = query.filter(CampaignPost.title.ilike(f"%{search}%"))

	posts = query.order_by(CampaignPost.created_at.desc()).offset(skip).limit(limit).all()
	return posts

# Xem chi tiết bài viết
@router.get("/posts/{post_id}", response_model=CampaignPostResponse)
def get_campaign_post_detail(post_id: str, db: Session = Depends(get_db)):
	"""Lấy chi tiết bài viết theo ID"""
	post = db.query(CampaignPost).filter(CampaignPost.id == post_id).first()
	if not post:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail="Không tìm thấy bài viết này."
		)
	return post


# Cập nhật bài viết
@router.put("/posts/{post_id}", response_model=CampaignPostResponse)
def update_campaign_post(
	post_id: str,
	post_in: CampaignPostUpdate,
	db: Session = Depends(get_db),
	current_user: User = Depends(get_current_user)
):
	"""Chỉnh sửa nội dung bài viết"""
	post = db.query(CampaignPost).filter(CampaignPost.id == post_id).first()
	if not post:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail="Không tìm thấy bài viết này."
		)

	if post.club.admin_id != current_user.id and current_user.role != UserRole.SUPER_ADMIN:
		raise HTTPException(
			status_code=status.HTTP_403_FORBIDDEN,
			detail="Bạn không có quyền chỉnh sửa bài viết này."
		)

	update_data = post_in.model_dump(exclude_unset=True)
	for field, value in update_data.items():
		setattr(post, field, value)

	db.commit()
	db.refresh(post)
	return post


# Xóa bài viết
@router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_campaign_post(
	post_id: str,
	db: Session = Depends(get_db),
	current_user: User = Depends(get_current_user)
):
	"""Xóa bài viết"""
	post = db.query(CampaignPost).filter(CampaignPost.id == post_id).first()
	if not post:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail="Không tìm thấy bài viết này."
		)

	if post.club.admin_id != current_user.id and current_user.role != UserRole.SUPER_ADMIN:
		raise HTTPException(
			status_code=status.HTTP_403_FORBIDDEN,
			detail="Bạn không có quyền xóa bài viết này."
		)

	db.delete(post)
	db.commit()
	return None

# # Route cho Like & Save UNDONE toggle like / save
# @router.post("/posts/{post_id}/like")
# def toggle_like_post(
# 	club_identifier: str,
# 	post_in: CampaignPostCreate,
# 	db: Session = Depends(get_db),
# 	current_user: User = Depends(get_current_user)
# ):
    
#     return {"message": "Toggled like successfully"}

# @router.post("/posts/{post_id}/save")
# def toggle_save_post(
# 	club_identifier: str,
# 	post_in: CampaignPostCreate,
# 	db: Session = Depends(get_db),
# 	current_user: User = Depends(get_current_user)
# ):
#     # Code xử lý lưu bài viết ở đây
#     return {"message": "Toggled save successfully"}