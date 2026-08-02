import sys
from datetime import datetime, timedelta, timezone

from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.user import User
from app.models.club import Club
from app.models.campaign_post import CampaignPost

Base.metadata.drop_all(bind=engine)   # Xóa toàn bộ bảng cũ
Base.metadata.create_all(bind=engine) # Tạo lại toàn bộ bảng mới

def seed_data():
	db = SessionLocal()

	try:
		print("🌱 Đang bắt đầu gieo dữ liệu mẫu (Seeding data)...")

		# -------------------------------------------------------------
		# 1. TẠO TÀI KHOẢN MẪU (USERS)
		# -------------------------------------------------------------
		hashed_password = get_password_hash("123456")  # Mật khẩu chung cho tiện test: 123456

		# Kiểm tra xem đã có user test chưa, nếu chưa thì tạo
		admin_user = db.query(User).filter(User.email == "admin@ams.edu.vn").first()
		if not admin_user:
			admin_user = User(
				email="admin@ams.edu.vn",
				hashed_password=hashed_password,
				full_name="Admin 01",
				role="super_admin",
				is_active=True,
			)
			db.add(admin_user)

		student_user = db.query(User).filter(User.email == "hocsinh@ams.edu.vn").first()
		if not student_user:
			student_user = User(
				email="hocsinh@ams.edu.vn",
				hashed_password=hashed_password,
				full_name="Học Sinh",
				role="student",
				is_active=True,
			)
			db.add(student_user)

		db.commit()  # Lưu user để lấy ID
		print("✅ Đã tạo tài khoản mẫu thành công!")

		# -------------------------------------------------------------
		# 2. TẠO CÂU LẠC BỘ MẪU (CLUBS)
		# -------------------------------------------------------------
		club_1 = db.query(Club).filter(Club.name == "Hanoi Ams Testing Club").first()
		if not club_1:
			club_1 = Club(
				admin_id=admin_user.id,
				name="Hanoi Ams Testing Club",
				code="HATC",
				description="Câu lạc bộ Testing Club.",

				category="Testing",
				logo_url="/static/images/default-logo.jpg",
				banner_url="/static/images/default-banner.jpg",
				contact_email="hanoiamstestingclub@gmail.com",
			)
			db.add(club_1)

		club_2 = db.query(Club).filter(Club.name == "AMS Computer Club").first()
		if not club_2:
			club_2 = Club(
				admin_id=admin_user.id,
				name="AMS Computer Club",
				code="ACC",
				description="Câu lạc bộ Tin học & Lập trình Ams.",
				category="Academic & Tech",
				logo_url="/static/images/default-logo.jpg",
				banner_url="/static/images/default-banner.jpg",
				contact_email="acc@gmail.com",
			)
			db.add(club_2)

		db.commit()  # Lưu club để lấy ID
		print("✅ Đã tạo Câu lạc bộ mẫu thành công!")

		# -------------------------------------------------------------
		# 3. TẠO BÀI VIẾT TUYỂN QUÂN MẪU (CAMPAIGN POSTS)
		# -------------------------------------------------------------
		existing_post = db.query(CampaignPost).first()
		if not existing_post:
			post_1 = CampaignPost(
				club_id=club_1.id,
				type="RECRUITMENT",
				title="[HATC] CHÍNH THỨC MỞ ĐƠN TUYỂN THÀNH VIÊN GEN 15",
				content="Mùa hè này, Hanoi Ams Testing Club chính thức tìm kiếm những mảnh ghép tiếp theo cho các ban: Nội dung, Kỹ thuật, Truyền thông..."
			)
			post_2 = CampaignPost(
				club_id=club_2.id,
				type="RECRUITMENT",
				title="[ACC] TUYỂN THÀNH VIÊN BAN CHUYÊN MÔN LẬP TRÌNH 2026",
				content="Bạn đam mê viết code và giải thuật? Hãy tham gia gia đình ACC ngay hôm nay!"
			)
			db.add_all([post_1, post_2])
			db.commit()
			print("✅ Đã tạo Bài viết đợt tuyển quân mẫu thành công!")

		print("\n🎉 HOÀN THÀNH SEED DATA! Database đã có sẵn dữ liệu chuẩn để làm Frontend.")

	except Exception as e:
		print(f"❌ Lỗi khi seed data: {e}")
		db.rollback()
	finally:
		db.close()


if __name__ == "__main__":
	seed_data()