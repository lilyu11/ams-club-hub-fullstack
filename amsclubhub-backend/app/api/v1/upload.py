import io
import os
import uuid

try:
    import magic  # python-magic for MIME type detection
    MAGIC_AVAILABLE = True
except (ImportError, Exception):
    magic = None
    MAGIC_AVAILABLE = False
from fastapi import APIRouter, UploadFile, File, HTTPException, status, Depends
from PIL import Image, ImageOps
from supabase import create_client, Client

from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/upload", tags=["Upload File"])

# Cấu hình tối ưu ảnh
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 20 * 1024 * 1024  # Tối đa 20 MB
MAX_DIMENSION = 1920              # Rộng/Cao tối đa 1920px (Full HD)
UPLOAD_DIR = "uploads/images"

# Cấu hình Supabase Client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
BUCKET_NAME = "uploads"  # Tên Bucket bạn tạo trên Supabase Storage

supabase_client: Client = None
if SUPABASE_URL and SUPABASE_KEY:
	supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)


def validate_file_type(file: UploadFile, contents: bytes) -> tuple[bool, str]:
    # Validate file type bằng cách check cả extension lẫn MIME type (magic bytes)
    # Return (is_valid, error_message)

    # Check extension
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        return False, f"Định dạng file không hợp lệ. Chỉ chấp nhận: {', '.join(ALLOWED_EXTENSIONS)}"

    # Check MIME type bằng python-magic (magic bytes)
    try:
        if MAGIC_AVAILABLE:
            mime_type = magic.from_buffer(contents, mime=True)
        else:
            mime_type = file.content_type or ""
    except Exception:
        mime_type = file.content_type or ""

    if mime_type not in ALLOWED_MIME_TYPES:
        return False, f"Loại file không được phép. Chỉ chấp nhận ảnh JPEG, PNG, WebP."

    # Kiểm tra xem extension có match MIME type không
    ext_mime_map = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
    }
    expected_mime = ext_mime_map.get(file_ext)
    if expected_mime and mime_type != expected_mime:
        return False, f"Đuôi file không khớp với nội dung thực tế."

    return True, ""


@router.post("/image")
async def upload_image(
	file: UploadFile = File(...),
	current_user: User = Depends(get_current_user)
):
	"""
	**Upload & Tự động tối ưu/nén ảnh (Avatar, Logo, Banner, Poster):**

	- Nhận file tối đa 20MB
	- Sửa góc xoay ảnh máy cơ/điện thoại (EXIF)
	- Resize về kích thước chuẩn Web (Max 1920px)
	- Nén & Convert sang định dạng WebP siêu nhẹ
	- Upload trực tiếp lên Supabase Storage CDN (Fallback về Local nếu chưa config Supabase)
	"""
	# Đọc dữ liệu file & Kiểm tra dung lượng
	contents = await file.read()
	original_size_bytes = len(contents)
	if original_size_bytes > MAX_FILE_SIZE:
		raise HTTPException(
			status_code=status.HTTP_400_BAD_REQUEST,
			detail="Dung lượng file vượt quá giới hạn 20MB."
		)

	# Validate file type (extension + MIME type + magic bytes)
	is_valid, error_msg = validate_file_type(file, contents)
	if not is_valid:
		raise HTTPException(
			status_code=status.HTTP_400_BAD_REQUEST,
			detail=error_msg
		)

	try:
		# Mở ảnh bằng Pillow từ bộ nhớ RAM
		image = Image.open(io.BytesIO(contents))

		# Fix lỗi xoay ngược/nghiêng ảnh từ máy ảnh cơ hoặc smartphone
		image = ImageOps.exif_transpose(image)

		# Xử lý kĩ thuật về màu sắc & nền trong suốt (Alpha Channel)
		if image.mode in ("RGBA", "LA") or (image.mode == "P" and "transparency" in image.info):
			image = image.convert("RGBA")
		else:
			image = image.convert("RGB")

		# Resize ảnh nếu kích thước thực vượt quá 1920px (Giữ nguyên tỉ lệ khung hình)
		image.thumbnail((MAX_DIMENSION, MAX_DIMENSION), Image.Resampling.LANCZOS)

		# Tạo file name ngẫu nhiên đuôi .webp
		unique_filename = f"{uuid.uuid4().hex}.webp"

		# Nén ảnh thành BytesIO thay vì lưu trực tiếp xuống đĩa cứng
		output_buffer = io.BytesIO()
		image.save(output_buffer, "WEBP", quality=82, optimize=True)
		compressed_bytes = output_buffer.getvalue()
		compressed_size_bytes = len(compressed_bytes)

		# UPLOAD LÊN SUPABASE HOẶC FALLBACK LƯU LOCAL
		if supabase_client:
			# Tải byte dữ liệu đã nén lên Supabase Storage
			supabase_client.storage.from_(BUCKET_NAME).upload(
				path=unique_filename,
				file=compressed_bytes,
				file_options={"content-type": "image/webp"}
			)
			# Lấy Public URL tuyệt đối HTTPS từ CDN
			image_url = supabase_client.storage.from_(BUCKET_NAME).get_public_url(unique_filename)
		else:
			# Fallback lưu vào đĩa local nếu chưa cài Supabase Env
			os.makedirs(UPLOAD_DIR, exist_ok=True)
			file_path = os.path.join(UPLOAD_DIR, unique_filename)
			with open(file_path, "wb") as f:
				f.write(compressed_bytes)
			image_url = f"/static/images/{unique_filename}"

		# Tính toán thống kê hiệu quả nén ảnh
		orig_mb = round(original_size_bytes / (1024 * 1024), 2)
		comp_kb = round(compressed_size_bytes / 1024, 1)
		reduction = round((1 - compressed_size_bytes / original_size_bytes) * 100, 1)

		return {
			"message": "Upload và tối ưu ảnh thành công!",
			"filename": unique_filename,
			"image_url": image_url,  # Trả về HTTPS Supabase URL đầy đủ
			"width": image.width,
			"height": image.height,
			"stats": {
				"original_size": f"{orig_mb} MB",
				"compressed_size": f"{comp_kb} KB",
				"reduction_rate": f"-{reduction}%"
			}
		}

	except Exception as e:
		raise HTTPException(
			status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
			detail=f"Lỗi trong quá trình xử lý ảnh: {str(e)}"
		)