import hashlib
import smtplib
import httpx
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings


# Placeholder gợi ý trong .env.example — không bao giờ được xác minh, phải bỏ qua
_PLACEHOLDER_DOMAIN = "your-verified-domain.com"

BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"


def sender_parts() -> tuple[str, str]:
	# Tách (name, email) từ settings.EMAILS_FROM dạng "Tên <email@domain.com>"
	# Fallback về EMAILS_FROM_NAME <SMTP_USER> nếu EMAILS_FROM để trống/placeholder
	name, email = settings.EMAILS_FROM_NAME, ""
	if settings.EMAILS_FROM and _PLACEHOLDER_DOMAIN not in settings.EMAILS_FROM:
		if "<" in settings.EMAILS_FROM and ">" in settings.EMAILS_FROM:
			email = settings.EMAILS_FROM[settings.EMAILS_FROM.index("<") + 1:settings.EMAILS_FROM.index(">")].strip()
			parsed_name = settings.EMAILS_FROM[:settings.EMAILS_FROM.index("<")].strip()
			if parsed_name:
				name = parsed_name
		else:
			email = settings.EMAILS_FROM.strip()
	if not email:
		email = settings.SMTP_USER
	return name, email


def sender_address() -> str:
	# Dạng "Tên <email>" dùng cho SMTP
	name, email = sender_parts()
	return f"{name} <{email}>"


def hash_otp(otp_code: str) -> str:
	# Hash OTP dùng SHA-256 để bảo mật
	return hashlib.sha256(otp_code.encode()).hexdigest()


def make_idempotency_key(to_email: str, subject: str) -> str:
	# Tạo mã định danh để chỉ gửi được 1 OTP duy nhất trong 1p
	import time
	raw = f"{to_email}:{subject}:{int(time.time()) // 60}"  # Đổi mỗi phút
	return hashlib.sha256(raw.encode()).hexdigest()[:32]


async def send_html_email(to_email: str, subject: str, html_content: str, idempotency_key: str | None = None) -> bool:
	# Gửi qua Brevo, fallback về Gmail SMTP
	if settings.BREVO_API_KEY:
		try:
			sender_name, sender_email = sender_parts()
			headers = {"api-key": settings.BREVO_API_KEY, "Content-Type": "application/json"}
			if idempotency_key:
				headers["X-Idempotency-Key"] = idempotency_key
			async with httpx.AsyncClient(timeout=settings.EMAIL_TIMEOUT_SECONDS) as client:
				response = await client.post(
					BREVO_API_URL,
					headers=headers,
					json={
						"sender": {"name": sender_name, "email": sender_email},
						"to": [{"email": to_email}],
						"subject": subject,
						"htmlContent": html_content,
					},
				)
				if response.status_code not in (200, 201):
					print(f"[Brevo] Error {response.status_code}: {response.text}")
					return False
			return True
		except Exception as exc:
			print(f"[Brevo] Failed to send email to {to_email}: {exc}")
			return False

	if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
		print(f"[Warning] Email provider is not configured; skipped email to {to_email}")
		return False

	try:
		msg = MIMEMultipart("alternative")
		msg["Subject"] = subject
		msg["From"] = sender_address()
		msg["To"] = to_email
		msg.attach(MIMEText(html_content, "html", "utf-8"))
		with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=settings.EMAIL_TIMEOUT_SECONDS) as server:
			server.starttls()
			server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
			server.sendmail(settings.SMTP_USER, to_email, msg.as_string())
		return True
	except Exception as exc:
		print(f"[SMTP] Xảy ra lỗi khi gửi email tới {to_email}: {exc}")
		return False


async def send_reminder_email(to_email: str, user_name: str, post_title: str, club_name: str, email_message: str, action_url: str) -> bool:
	# Gửi email nhắc nhở qua Brevo (HTTPS) hoặc SMTP fallback
	subject = f"⏰ [AmsClubHub] NHẮC NHỞ: SẮP HẾT HẠN ĐIỀN ĐƠN/ĐĂNG KÝ {post_title}!"
	idempotency_key = make_idempotency_key(to_email, subject)

	html_content = f"""
	<html>
		<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
		<div style="max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px;">
			<h2 style="color: #e53935;">Bạn đã nhận được thông báo từ {club_name}!</h2>
			<p>Xin chào <strong>{user_name}</strong>!,</p>
			<p>Bạn đã đăng ký nhận thông báo nhắc nhở bài viết <strong>{post_title}</strong>:</p>

			<div style="background-color: #f9f9f9; border-left: 4px solid #e53935; padding: 15px; margin: 15px 0;">

			<p style="margin: 0; color: #d32f2f;"><strong>{email_message}</strong></p>
			</div>

			<p>Hãy nhanh tay hoàn thiện đơn đăng ký trước khi cổng đăng ký đóng lại nhé!</p>

			<p style="text-align: center; margin-top: 25px;">
			<a href="{action_url or '/'}" style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">ĐĂNG KÝ NGAY</a>
			</p>
			<hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;">
			<p style="font-size: 12px; color: #888; text-align: center;">Thư này được gửi tự động từ hệ thống AmsClubHub, vui lòng không phản hồi email này.</p>
		</div>
		</body>
	</html>
	"""
	return await send_html_email(to_email, subject, html_content, idempotency_key)


async def send_otp_email(to_email: str, otp_code: str) -> bool:
	# Gửi mã OTP xác nhận đăng ký tài khoản qua Brevo (HTTPS) hoặc SMTP fallback
	subject = "🔑 [AmsClubHub] Mã xác nhận đăng ký tài khoản"
	idempotency_key = make_idempotency_key(to_email, subject)

	html_content = f"""
	<html>
		<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
		<div style="max-width: 500px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; padding: 24px;">
			<h2 style="color: #111; text-align: center;">Xác thực đăng ký tài khoản</h2>
			<p>Chúng tôi nhận được yêu cầu đăng ký tài khoản AmsClubHub từ email này.</p>
			<p>Mã OTP của bạn là:</p>

			<div style="background-color: #f4f4f5; text-align: center; padding: 15px; margin: 20px 0; border-radius: 8px;">
			<span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #000;">{otp_code}</span>
			</div>

			<p style="font-size: 13px; color: #666;">Mã xác nhận có hiệu lực trong <strong>5 phút</strong>. Vui lòng không chia sẻ mã này cho bất kỳ ai. Nếu không phải bạn, hãy bỏ qua email này.</p>
			<hr style="border: none; border-top: 1px solid #eee; margin-top: 25px;">
			<p style="font-size: 11px; color: #999; text-align: center;">Thư này được gửi tự động từ hệ thống AmsClubHub, vui lòng không phản hồi email này.</p>
		</div>
		</body>
	</html>
	"""
	return await send_html_email(to_email, subject, html_content, idempotency_key)


async def send_reset_password_otp_email(to_email: str, otp_code: str) -> bool:
	# Gửi mã OTP khôi phục mật khẩu qua Brevo (HTTPS) hoặc SMTP fallback
	subject = "🔐 [AmsClubHub] Yêu cầu đặt lại mật khẩu"
	idempotency_key = make_idempotency_key(to_email, subject)

	html_content = f"""
	<html>
		<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
		<div style="max-width: 500px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; padding: 24px;">
			<h2 style="color: #111; text-align: center;">Yêu cầu đặt lại mật khẩu</h2>
			<p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản AmsClubHub từ email này.</p>
			<p>Mã OTP của bạn là:</p>

			<div style="background-color: #f4f4f5; text-align: center; padding: 15px; margin: 20px 0; border-radius: 8px;">
			<span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #d97706;">{otp_code}</span>
			</div>

			<p style="font-size: 13px; color: #666;">Mã này có hiệu lực trong <strong>5 phút</strong>. Vui lòng không chia sẻ mã này cho bất kỳ ai. Nếu không phải bạn, hãy bỏ qua email này.</p>
			<hr style="border: none; border-top: 1px solid #eee; margin-top: 25px;">
			<p style="font-size: 11px; color: #999; text-align: center;">Thư này được gửi tự động từ hệ thống AmsClubHub, vui lòng không phản hồi email này.</p>
		</div>
		</body>
	</html>
	"""
	return await send_html_email(to_email, subject, html_content, idempotency_key)
