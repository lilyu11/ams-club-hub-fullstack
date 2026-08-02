import io
import os
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException, status, Depends
from PIL import Image, ImageOps

from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/upload", tags=["Upload File"])

# Cấu hình tối ưu ảnh
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_FILE_SIZE = 20 * 1024 * 1024  # Tối đa 20 MB
MAX_DIMENSION = 1920              # Rộng/Cao tối đa 1920px (Full HD)
UPLOAD_DIR = "uploads/images"


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
	"""
	# Kiểm tra định dạng đuôi file
	file_ext = os.path.splitext(file.filename)[1].lower()
	if file_ext not in ALLOWED_EXTENSIONS:
		raise HTTPException(
			status_code=status.HTTP_400_BAD_REQUEST,
			detail=f"Định dạng file không hợp lệ. Chỉ chấp nhận: {', '.join(ALLOWED_EXTENSIONS)}"
		)

	# Đọc dữ liệu file & Kiểm tra dung lượng
	contents = await file.read()
	original_size_bytes = len(contents)
	if original_size_bytes > MAX_FILE_SIZE:
		raise HTTPException(
			status_code=status.HTTP_400_BAD_REQUEST,
			detail="Dung lượng file vượt quá giới hạn 20MB."
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
		file_path = os.path.join(UPLOAD_DIR, unique_filename)
		os.makedirs(UPLOAD_DIR, exist_ok=True)

		# Lưu file dạng .webp chất lượng 82% (Mức tối ưu cân bằng nét/nhẹ)
		image.save(file_path, "WEBP", quality=82, optimize=True)

		# Tính toán thống kê hiệu quả nén ảnh
		compressed_size_bytes = os.path.getsize(file_path)
		orig_mb = round(original_size_bytes / (1024 * 1024), 2)
		comp_kb = round(compressed_size_bytes / 1024, 1)
		reduction = round((1 - compressed_size_bytes / original_size_bytes) * 100, 1)

		return {
			"message": "Upload và tối ưu ảnh thành công!",
			"filename": unique_filename,
			"image_url": f"/static/images/{unique_filename}",
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