/**
 * Chuyển chuỗi thời gian từ backend (UTC naive datetime) thành chuỗi hiển thị theo múi giờ Việt Nam.
 *
 * Backend trả về dạng: "2026-09-02 10:30:00" hoặc "2026-09-02T10:30:00" (UTC, không có timezone offset).
 * → Thêm 'Z' để JavaScript interpret đúng là UTC.
 * → Hiển thị theo múi giờ VN (Asia/Ho_Chi_Minh, UTC+7) bằng toLocaleString.
 */
const VIETNAM_TZ = 'Asia/Ho_Chi_Minh';

function parseToUTC(dateStr: string): Date {
	// Thay khoảng trắng bằng 'T' cho đồng nhất
	let s = dateStr.replace(' ', 'T');

	// Nếu đã có offset (+hh:mm) thì giữ nguyên (đã timezone-aware)
	// Nếu chưa có offset hay 'Z' thì thêm 'Z' vì backend lưu UTC
	if (!s.endsWith('Z') && !s.includes('+') && !s.includes('-', 10)) {
		s += 'Z';
	}

	return new Date(s);
}

/**
 * Hiển thị thời gian tương đối: "Vừa xong", "5 phút trước", "3 giờ trước"
 * hoặc ngày tháng nếu trên 24 giờ (định dạng vi-VN theo múi giờ VN)
 */
export function formatTime(dateStr?: string): string {
	if (!dateStr) return 'Mới đây';

	try {
		const date = parseToUTC(dateStr);
		const now = Date.now();
		const diffInSeconds = Math.floor((now - date.getTime()) / 1000);

		if (diffInSeconds < 60) return 'Vừa xong';

		const minutes = Math.floor(diffInSeconds / 60);
		if (minutes < 60) return `${minutes} phút trước`;

		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours} giờ trước`;

		// Trên 24 giờ → hiển thị ngày theo múi giờ VN
		return date.toLocaleDateString('vi-VN', { timeZone: VIETNAM_TZ });
	} catch {
		return 'Mới đây';
	}
}

/**
 * Hiển thị ngày giờ đầy đủ theo múi giờ VN
 */
export function formatDateTime(dateStr?: string): string {
	if (!dateStr) return '';

	try {
		const date = parseToUTC(dateStr);
		return date.toLocaleString('vi-VN', {
			timeZone: VIETNAM_TZ,
			hour: '2-digit',
			minute: '2-digit',
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		});
	} catch {
		return '';
	}
}
