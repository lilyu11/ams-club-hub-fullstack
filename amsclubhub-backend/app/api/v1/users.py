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
	
	if current_user.role == UserRole.CLUB_ADMIN:
		club = db.query(Club).filter(Club.admin_id == current_user.id).first()
		if club:
			managed_club_id = club.id

	return {
		**current_user.__dict__,
		"club_id": managed_club_id  # Trả club_id về cho frontend
	}
