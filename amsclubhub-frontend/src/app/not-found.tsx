import Link from 'next/link';
import { FileQuestion, Home } from 'lucide-react';

export default function NotFound() {
	return (
		<div className="min-h-[80vh] flex flex-col items-center justify-center p-4 text-center space-y-5">
			{/* Icon minh họa */}
			<div className="p-4 bg-primary/10 text-primary rounded-full animate-bounce">
				<FileQuestion className="w-12 h-12" />
			</div>

			{/* Mã lỗi & Tiêu đề */}
			<div className="space-y-2">
				<h1 className="text-6xl sm:text-7xl font-extrabold text-foreground tracking-tight">404</h1>
				<h2 className="text-lg sm:text-xl font-semibold text-foreground">
					Không tìm thấy trang
				</h2>
				<p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
					Chưa có gì đâu bro về tạm trang chủ đã nhé *emoji trái tim*
					{/* Đường dẫn bạn đang truy cập không có dữ liệu. Vui lòng kiểm tra lại URL hoặc quay về trang chủ. */}
				</p>
			</div>

			{/* Nút quay về trang chủ */}
			<div className="pt-2">
				<Link
					href="/"
					prefetch={false}
					className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:opacity-90 text-primary-foreground font-medium rounded-xl text-xs sm:text-sm transition shadow-sm active:scale-95"
				>
					<Home className="w-4 h-4" />
					<span>Quay về trang chủ</span>
				</Link>
			</div>
		</div>
	);
}