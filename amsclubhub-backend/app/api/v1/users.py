from fastapi import APIRouter, Depends
from app.api.deps import get_current_user
from app.models.user import User 
from app.schemas.auth import UserResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.club import Club
from app.models.user import User, UserRole

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me", response_model=UserResponse)
def read_current_user(
	current_user: User = Depends(get_current_user),
	db: Session = Depends(get_db)
):
	managed_club_id = None
	club_slug = None

	if current_user.role == UserRole.CLUB_ADMIN:
		club = db.query(Club).filter(Club.admin_id == current_user.id).first()
		if club:
			managed_club_id = club.id
			club_slug = getattr(club, 'slug', None)

	# Chỉ trả về các trường an toàn, KHÔNG leak hashed_password
	return UserResponse(
		id=current_user.id,
		email=current_user.email,
		full_name=current_user.full_name,
		student_id=current_user.student_id,
		role=current_user.role,
		is_active=current_user.is_active,
		club_id=managed_club_id,
		club_slug=club_slug
	)
