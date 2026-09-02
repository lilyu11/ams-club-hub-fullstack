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
		</div>
	);
}