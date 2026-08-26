import json
import sys
import os
import uuid
from datetime import datetime, timezone

# Đưa thư mục amsclubhub-backend lên đầu danh sách sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.models.club import Club
from app.core.security import get_password_hash

def onboard_beta_admins():
    db = SessionLocal()
    
    json_path = os.path.join(os.path.dirname(__file__), "beta_clubs.json")
    if not os.path.exists(json_path):
        print(f"❌ KHÔNG TÌM THẤY FILE: {json_path}")
        return

    with open(json_path, "r", encoding="utf-8") as f:
        clubs_data = json.load(f)

    print(f"🚀 Bắt đầu tạo tài khoản và trao quyền cho {len(clubs_data)} CLB...\n")
    success_count = 0
    not_found_clubs = []

    try:
        for index, item in enumerate(clubs_data, start=1):
            club_name = item["full_name"]
            admin_email = item["email"]
            raw_password = item["password"]

            # 1. Tìm CLB theo tên trong DB
            club = db.query(Club).filter(Club.name == club_name).first()
            if not club:
                print(f"⚠️  [{index}/{len(clubs_data)}] Bỏ qua: Không tìm thấy CLB tên '{club_name}' trong DB")
                not_found_clubs.append(club_name)
                continue

            # 2. Tạo tài khoản mới
            user = db.query(User).filter(User.email == admin_email).first()
            if not user:
                user = User(
                    id=str(uuid.uuid4()),
                    email=admin_email,
                    hashed_password=get_password_hash(raw_password),
                    full_name=club_name,
                    role=UserRole.CLUB_ADMIN,
                    created_at=datetime.now(timezone.utc)  # Đã sửa lỗi utcnow deprecated
                )
                db.add(user)
                db.flush()
                print(f"✅ [{index}/{len(clubs_data)}] ĐÃ TẠO TÀI KHOẢN: {admin_email}")
            else:
                print(f"ℹ️  [{index}/{len(clubs_data)}] Tài khoản đã tồn tại: {admin_email}")

            # 3. Gán Admin cho CLB
            club.admin_id = user.id
            success_count += 1
            print(f"   🔗 Đã gán {admin_email} làm Admin cho '{club_name}'")

        db.commit()
        print(f"\n🎉 HOÀN THÀNH! Đã tạo và gán thành công {success_count}/{len(clubs_data)} tài khoản Admin CLB.")
        
        if not_found_clubs:
            print(f"\n⚠️  Có {len(not_found_clubs)} CLB không khớp tên trong Database:")
            for name in not_found_clubs:
                print(f"   - {name}")

    except Exception as e:
        db.rollback()
        print(f"\n❌ LỖI TRONG QUÁ TRÌNH THỰC THI: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    onboard_beta_admins()