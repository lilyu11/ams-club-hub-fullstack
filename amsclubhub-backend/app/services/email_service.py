import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings


def send_reminder_email(to_email: str, user_name: str, post_title: str, club_name: str, deadline_str: str, action_url: str):
	# Hàm gửi Email nhắc nhở HTML qua Gmail SMTP
	if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
		print(f"[Warning] Chưa cấu hình SMTP_USER / SMTP_PASSWORD trong .env. Bỏ qua gửi mail tới {to_email}")
		return False

	try:
		msg = MIMEMultipart("alternative")
		msg["Subject"] = f"⏰ [AmsClubHub] Nhắc nhở: Sắp hết hạn nộp {post_title}!"
		msg["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.SMTP_USER}>"
		msg["To"] = to_email

		# Nội dung Email giao diện HTML đẹp mắt
		html_content = f"""
		<html>
		  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
			<div style="max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px;">
			  <h2 style="color: #e53935;">⏰ Nhắc nhở Sắp hết hạn Nộp đơn / Đăng ký</h2>
			  <p>Xin chào <strong>{user_name}</strong>,</p>
			  <p>Bạn đã đăng ký nhận thông báo nhắc nhở bài viết tuyển quân/sự kiện từ CLB <strong>{club_name}</strong>:</p>

			  <div style="background-color: #f9f9f9; border-left: 4px solid #e53935; padding: 15px; margin: 15px 0;">
				<h3 style="margin: 0 0 10px 0; color: #111;">{post_title}</h3>
				<p style="margin: 0; color: #d32f2f;"><strong>Hạn chót (Deadline): {deadline_str}</strong></p>
			  </div>

			  <p>Hãy nhanh tay hoàn thiện đơn đăng ký trước khi cổng ứng tuyển đóng lại nhé!</p>

			  <p style="text-align: center; margin-top: 25px;">
				<a href="{action_url or '#'}" style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">👉 TRUY CẬP ĐƠN ĐĂNG KÝ ngay</a>
			  </p>
			  <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;">
			  <p style="font-size: 12px; color: #888; text-align: center;">Thư này được gửi tự động từ Hệ thống AmsClubHub, xin vui lòng không phản hồi email này.</p>
			</div>
		  </body>
		</html>
		"""

		msg.attach(MIMEText(html_content, "html", "utf-8"))

		# Kết nối tới Gmail Server
		with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
			server.starttls()
			server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
			server.sendmail(settings.SMTP_USER, to_email, msg.as_string())

		print(f"✅ Đã gửi Email nhắc nhở thành công tới: {to_email}")
		return True
	except Exception as e:
		print(f"❌ Lỗi khi gửi Email tới {to_email}: {str(e)}")
		return False