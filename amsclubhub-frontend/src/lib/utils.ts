import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

// Lấy domain gốc Backend (VD: http://localhost:8000)
const BACKEND_DOMAIN = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
	.replace(/\/api\/v1\/?$/, '');

// Hàm xử lý URL ảnh
export function getFullImageUrl(path?: string | null): string {
	// Thay thế placeholder hỏng bằng placehold.co
	if (!path || path === 'string' || path.includes('via.placeholder.com')) {
		return 'https://placehold.co/300x300?text=No+Image';
	}

	if (path.startsWith('blob:')) {
		return 'https://placehold.co/300x300?text=Invalid+Image';
	}

	// FIX LỖI: Sửa cứng URL localhost trỏ về domain Render thực tế
	if (path.includes('localhost:8000')) {
		path = path.replace('http://localhost:8000', '').replace('https://localhost:8000', '');
	}

	// Nếu đã là URL tuyệt đối hợp lệ (http://... hoặc https://...)
	if (
		path.startsWith('http://') ||
		path.startsWith('https://') ||
		path.startsWith('data:')
	) {
		return path;
	}

	// Chuẩn hóa đường dẫn tương đối từ Backend
	const cleanPath = path.startsWith('/') ? path : `/${path}`;
	// Thay đổi mặc định fallback từ localhost sang domain Render
	const backendBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://ams-club-hub-fullstack.onrender.com';

	// Tách lấy domain gốc (bỏ /api/v1 nếu có)
	try {
		const origin = new URL(backendBaseUrl).origin;
		return `${origin}${cleanPath}`;
	} catch {
		return `https://ams-club-hub-fullstack.onrender.com${cleanPath}`;
	}
}