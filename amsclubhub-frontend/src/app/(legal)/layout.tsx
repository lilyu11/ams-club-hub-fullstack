'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/navigation';



export default function LegalRootLayout({ children }: { children: React.ReactNode }) {
	// const handlePrint = () => {
	// 	window.print();
	// };
	const router = useRouter();
	const handleHomePage = () => {
		router.push('/');
	}

	return (
		<div className="min-h-screen bg-white text-zinc-900 font-sans antialiased selection:bg-zinc-200">
			{/* Top Header */}
			<header className="border-b border-zinc-200 bg-white sticky top-0 z-50">
				<div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
					<button
						type="button"
						onClick={handleHomePage}
						className="text-sm font-medium text-zinc-600 hover:text-zinc-900 flex items-center gap-1.5 transition-colors"
					>
						<ChevronLeft className="w-4 h-4" /> Quay lại trang chủ
					</button>
					{/* <button
						onClick={handlePrint}
						className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 rounded transition-colors"
					>
						🖨️ Chữ in
					</button> */}
				</div>
			</header>

			{/* Nơi chứa nội dung của từng trang (Privacy / Terms) */}
			<main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">{children}</main>

			{/* Footer đen theo Style Netflix */}
			<footer className="bg-black text-zinc-400 text-sm mt-20 border-t border-zinc-800">
				<div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-8">
					{/* Hàng 1: Bạn cần thêm trợ giúp? + Button Contact */}
					{/* <div className="flex flex-col sm:flex-row sm:items-center gap-4">
						<span className="text-xl font-bold text-white">Bạn cần thêm trợ giúp?</span>
						<a
							href="mailto:amsclubhub@gmail.com"
							className="inline-block w-fit px-5 py-2 text-sm font-semibold text-black bg-white hover:bg-zinc-200 rounded transition-colors"
						>
							Liên hệ chúng tôi
						</a>
					</div>

					<hr className="border-zinc-800" /> */}

					{/* Hàng 2: Select Ngôn ngữ
					<div>
						<select
							defaultValue="vi"
							className="bg-black text-zinc-300 border border-zinc-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-white"
						>
							<option value="vi">Tiếng Việt</option>
							<option value="en">English</option>
						</select>
					</div> */}

					{/* Hàng 3: Các liên kết pháp lý */}
					<div className="flex flex-col space-y-3 pt-2 text-xs text-zinc-400">
						<Link href="/terms" className="hover:underline w-fit">
							Điều khoản dịch vụ
						</Link>
						<Link href="/privacy" className="hover:underline w-fit">
							Quyền riêng tư
						</Link>
						<Link href="/project-info" className="hover:underline w-fit">
							Thông tin dự án
						</Link>
						{/* <span className="hover:underline cursor-pointer w-fit">Tùy chọn cookie</span> */}
						<span className="text-zinc-500 pt-2">© 2026 AMS Club Hub. All rights reserved.</span>
					</div>
				</div>
			</footer>
		</div>
	);
}