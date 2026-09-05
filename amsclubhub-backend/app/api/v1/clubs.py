from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.encoders import jsonable_encoder
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
import logging
import json

from pydantic import BaseModel

from app.core.database import get_db
from app.api.deps import get_current_user, get_optional_user
from app.models.user import User, UserRole
from app.models.club import Club, ClubFollower
from app.models.campaign_post import CampaignPost
from app.schemas.club import ClubCreate, ClubUpdate, ClubResponse, ClubDeleteConfirm, ClubFollowResponse
from app.schemas.campaign_post import CampaignPostResponse
from app.core.security import verify_password
from app.schemas.auth import UserResponse
from app.core.cache import get_cached, set_cached, invalidate, get_version, cache_key

router = APIRouter(prefix="/clubs", tags=["Clubs"])
logger = logging.getLogger(__name__)

# Hàm helper tìm CLB theo UUID (id) hoặc mã định danh (code)
def get_club_by_identifier(club_id: str, db: Session) -> Club:
	club = db.query(Club).filter(
		or_(Club.id == club_id, Club.code == club_id, Club.name == club_id)
	).first()

	if not club:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail=f"Không tìm thấy Câu lạc bộ với ID hoặc mã: '{club_id}'."
		)
	return club

@router.post("/", response_model=ClubResponse, status_code=status.HTTP_201_CREATED)
def create_club(
 	 club_in: ClubCreate,
	  db: Session = Depends(get_db),
 	 current_user: User = Depends(get_current_user)
):
  
	# Tạo Câu lạc bộ mới
	# Người tạo request sẽ tự động trở thành Club Admin của CLB
	
	# Kiểm tra trùng tên hoặc mã CLB (code)
	existing_club = db.query(Club).filter(
	(Club.name == club_in.name) | (Club.code == club_in.code)
	).first()
  
	if existing_club:
		raise HTTPException(
		status_code=status.HTTP_400_BAD_REQUEST,
		detail="Tên hoặc mã câu lạc bộ (Code) này đã tồn tại."
		)

 	# Tạo CLB mới và gán admin_id = ID của user đang đăng nhập
	new_club = Club(
 	**club_in.model_dump(),
	admin_id=current_user.id
	)

	db.add(new_club)
	db.commit()
	invalidate('clubs')
	db.refresh(new_club)
	return new_club


@router.get("/", response_model=List[ClubResponse])
def get_clubs(
	category: Optional[str] = Query(None, description="Lọc theo thể loại"),
	search: Optional[str] = Query(None, description="Tìm kiếm theo tên hoặc mã CLB"),
	skip: int = 0,
	limit: int = 100,
	db: Session = Depends(get_db)
	):
	
	# Lấy danh sách tất cả các CLB (Công khai)
	# Hỗ trợ lọc theo category và tìm kiếm tên

	cache_key_name = f"clubs:v{get_version('clubs')}:{cache_key(category, search, skip, limit)}"
	cached = get_cached(cache_key_name)
	if cached is not None:
		return json.loads(cached)

	query = db.query(Club).order_by(Club.display_order.asc()).filter(Club.is_active == True)

	if category:
		query = query.filter(Club.category == category)

	if search:
		search_filter = f"%{search}%"
		query = query.filter(
		(Club.name.ilike(search_filter)) | (Club.code.ilike(search_filter))
		)

	clubs = query.offset(skip).limit(limit).all()
	set_cached(cache_key_name, jsonable_encoder(clubs), ttl=60)
	return clubs


@router.get("/{club_id}", response_model=ClubResponse)
def get_club_by_id(club_id: str, db: Session = Depends(get_db)):
  # Lấy thông tin chi tiết của câu lạc bộ theo ID
  club = get_club_by_identifier(club_id, db)
  return club


class ClubDetailResponse(BaseModel):
    club: ClubResponse
    posts: List[CampaignPostResponse]
    is_following: bool = False


@router.get("/{club_id}/detail", response_model=ClubDetailResponse)
def get_club_detail(
    club_id: str,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """
    Endpoint tổng hợp trả về club, posts, is_following trong 1 request.
    Giảm số round-trip từ 3-4 request xuống còn 1 request phía client.
    is_following chỉ tính khi có access_token hợp lệ.
    """
    try:
        version = get_version('clubs')
        user_part = current_user.id if current_user else 'anon'
        cache_key_name = f"club:{club_id}:v{version}:user:{user_part}:{cache_key(skip, limit)}"
        cached = get_cached(cache_key_name)
        if cached is not None:
            return json.loads(cached)

        club = get_club_by_identifier(club_id, db)

        posts = db.query(CampaignPost).filter(CampaignPost.club_id == club.id)\
            .order_by(CampaignPost.created_at.desc()).offset(skip).limit(limit).all()

        is_following = False
        if current_user:
            is_following = db.query(ClubFollower).filter(
                ClubFollower.user_id == current_user.id,
                ClubFollower.club_id == club.id
            ).first() is not None

        result = ClubDetailResponse(club=club, posts=posts, is_following=is_following)
        set_cached(cache_key_name, jsonable_encoder(result), ttl=30)
        return result
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Lỗi khi xử lý /clubs/%s/detail", club_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Không thể tải chi tiết câu lạc bộ. Vui lòng thử lại sau.",
        ) from exc


@router.put("/{club_id}", response_model=ClubResponse, status_code=status.HTTP_200_OK)
def update_club(
	club_id: str,
	club_in: ClubUpdate,
	db: Session = Depends(get_db),
	current_user: User = Depends(get_current_user)
	):
	# Cập nhật thông tin CLB
	# Chỉ Chủ tịch CLB (admin_id) hoặc Super Admin mới có quyền sửa
	club = get_club_by_identifier(club_id, db)

	# Kiểm tra Club Admin hoặc Super Admin
	if club.admin_id != current_user.id and current_user.role != UserRole.SUPER_ADMIN:
		raise HTTPException(
		status_code=status.HTTP_403_FORBIDDEN,
		detail="Bạn không có quyền chỉnh sửa thông tin Câu lạc bộ này."
		)

	# Cập nhật các trường dữ liệu được truyền lên
	update_data = club_in.model_dump(exclude_unset=True)
	for field, value in update_data.items():
		setattr(club, field, value)

	db.commit()
	invalidate('clubs')
	db.refresh(club)
	return club

@router.delete("/{club_id}", status_code=status.HTTP_200_OK)
def soft_delete_club(
	club_id: str,
	payload: ClubDeleteConfirm,
	db: Session = Depends(get_db),
	current_user: User = Depends(get_current_user)
):
	"""
	**Soft delete (vô hiệu hóa) câu lạc bộ**

	Yêu cầu:
	1. Người dùng phải là Admin CLB hoặc Super Admin
	2. Phải nhập đúng mật khẩu xác nhận của tài khoản đăng nhập
	"""

	# Tìm CLB theo id
	club = get_club_by_identifier(club_id, db)

  # Kiểm tra phân quyền
	if club.admin_id != current_user.id and current_user.role != UserRole.SUPER_ADMIN:
		raise HTTPException(
			status_code=status.HTTP_403_FORBIDDEN,
			detail="Bạn không có quyền vô hiệu hóa câu lạc bộ này."
		)

  # Xác thực mật khẩu của người dùng
	if not verify_password(payload.password, current_user.hashed_password):
		raise HTTPException(
			status_code=status.HTTP_400_BAD_REQUEST,
			detail="Mật khẩu xác nhận không chính xác."
		)

  # Kiểm tra CLB có bị vô hiệu hóa từ trước không
	if not club.is_active:
		raise HTTPException(
			status_code=status.HTTP_400_BAD_REQUEST,
			detail="Câu lạc bộ này đã bị vô hiệu hóa từ trước."
		)

	club.is_active = False
	db.commit()
	invalidate('clubs')

	return {"message": f"Đã vô hiệu hóa câu lạc bộ {club.name} thành công."}

@router.post("/{club_id}/follow", response_model=ClubFollowResponse, status_code=status.HTTP_200_OK)
def toggle_follow_club(
	club_id: str,
	db: Session = Depends(get_db),
	current_user: User = Depends(get_current_user)
):
	"""
	Follow hoặc unfollow một câu lạc bộ (toggle)
	- Nếu chưa follow: Hệ thống sẽ tạo lượt theo dõi mới
	- Nếu đã follow: Hệ thống sẽ hủy lượt theo dõi
	- Club admin và super admin không được theo dõi CLB nào
	"""
	# Club admin và super admin không được theo dõi câu lạc bộ
	if current_user.role in (UserRole.CLUB_ADMIN, UserRole.SUPER_ADMIN):
		raise HTTPException(
			status_code=status.HTTP_403_FORBIDDEN,
			detail="Tài khoản admin không thể theo dõi câu lạc bộ"
		)

	# Tìm CLB theo ID hoặc code
	club = get_club_by_identifier(club_id, db)

	# Kiểm tra xem người dùng hiện tại đã follow CLB này chưa
	follow_record = db.query(ClubFollower).filter(
		ClubFollower.user_id == current_user.id,
		ClubFollower.club_id == club.id
	).first()

	if follow_record:
		# Nếu đã follow -> Tiến hành hủy follow
		db.delete(follow_record)
		db.commit()
		is_following = False
		message = f"Đã bỏ theo dõi câu lạc bộ '{club.name}'."
	else:
		# Nếu chưa follow -> Tiến hành follow
		new_follow = ClubFollower(
			user_id=current_user.id,
			club_id=club.id
		)
		db.add(new_follow)
		db.commit()
		is_following = True
		message = f"Đã theo dõi thành công câu lạc bộ '{club.name}'."

	# Đếm lại tổng số lượt follow hiện tại của CLB
	followers_count = db.query(ClubFollower).filter(ClubFollower.club_id == club.id).count()

	return ClubFollowResponse(
		message=message,
		is_following=is_following,
		followers_count=followers_count
	)

@router.get("/{club_id}/is-following")
def check_is_following(
	club_id: str,
	db: Session = Depends(get_db),
	current_user: User = Depends(get_current_user)
):
	club = get_club_by_identifier(club_id, db)
	if not club:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail=f"Không tìm thấy Câu lạc bộ với ID hoặc mã: '{club_id}'."
		)

	# Kiểm tra xem người dùng hiện tại có đang follow CLB này không
	is_following = db.query(ClubFollower).filter(
		ClubFollower.user_id == current_user.id,
		ClubFollower.club_id == club.id
	).first() is not None

	return {"is_following": is_following}

@router.get("/followed/me", response_model=List[ClubResponse])
def get_followed_clubs(
	db: Session = Depends(get_db),
	current_user: User = Depends(get_current_user)
):
	follows = db.query(ClubFollower).join(Club, ClubFollower.club_id == Club.id)\
	.options(joinedload(ClubFollower.club))\
	.filter(ClubFollower.user_id == current_user.id).order_by(Club.display_order.asc()).all()

	# Lọc ra các CLB mà người dùng đang follow (CLB active và không bị xóa)
	followed_clubs = [follow.club for follow in follows if follow.club.is_active and follow.club is not None]
	return followed_clubs

# @router.get("/{club_id}/followers", response_model=List[UserResponse])
# def get_club_followers(
# 	club_id: str,
# 	db: Session = Depends(get_db)
# ):

# 	# Lấy danh sách người dùng đang follow CLB
# 	club = get_club_by_identifier(club_id, db)
# 	followers = db.query(ClubFollower).filter(
# 	ClubFollower.club_id == club.id
# 	).all()

# 	return [follower.user for follower in followers]