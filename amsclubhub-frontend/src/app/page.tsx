'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getFullImageUrl } from '@/lib/utils';
import ClubSuggestCard from '@/components/club/ClubSuggestCard';

// CẤU HÌNH ĐƯỜNG DẪN BACKEND
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Kiểu dữ liệu TypeScript
interface Post {
	id: string | number;
	title?: string;
	content?: string;
	image_url?: string;
	created_at?: string;
	club?: {
	name?: string;
	logo_url: string;
	};
}

export interface Club {
	id: string | number;
	name: string;
	code: string;
	category?: string;
	description?: string;
	logo_url?: string | null;
	banner_url?: string | null;
	facebook_url?: string | null;
	contact_email?: string | null;
	is_active?: boolean;
	followers_count?: number;
}

export default function HomePage() {
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [posts, setPosts] = useState<Post[]>([]);
	const [clubs, setClubs] = useState<Club[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	// 1. KIỂM TRẢ TRẠNG THÁI ĐĂNG NHẬP
	useEffect(() => {
		const checkAuth = () => {
			const token =
				localStorage.getItem('token') ||
				localStorage.getItem('access_token') ||
				localStorage.getItem('user');
			setIsLoggedIn(!!token);
		};

		checkAuth();
		window.addEventListener('storage', checkAuth);
		return () => window.removeEventListener('storage', checkAuth);
	}, []);

	// 2. FETCH DỮ LIỆU THỰC TẾ TỪ DATABASE BACKEND
	useEffect(() => {
		const fetchData = async () => {
			setIsLoading(true);
			try {
				// Fetch Danh sách Bài đăng & Danh sách Câu lạc bộ
				const [postsRes, clubsRes] = await Promise.allSettled([
					fetch(`${API_BASE_URL}/posts`),
					fetch(`${API_BASE_URL}/clubs`),
				]);

				if (postsRes.status === 'fulfilled' && postsRes.value.ok) {
					const postsData = await postsRes.value.json();
					setPosts(Array.isArray(postsData) ? postsData : postsData.data || []);
				}

				if (clubsRes.status === 'fulfilled' && clubsRes.value.ok) {
					const clubsData = await clubsRes.value.json();
					setClubs(Array.isArray(clubsData) ? clubsData : clubsData.data || []);
				}
			} catch (error) {
				console.error('Lỗi khi tải dữ liệu từ Backend:', error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchData();
	}, []);

	const handleLogout = () => {
		localStorage.removeItem('token');
		localStorage.removeItem('access_token');
		localStorage.removeItem('user');
		setIsLoggedIn(false);
	};

	return (
		<div className="min-h-screen bg-slate-100/70 text-slate-800 font-sans">
			{/* NAVBAR HEADER */}
			<header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
				<div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
					<Link href="/" className="flex items-center gap-2">
						<div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-200">
							A
						</div>
						<span className="text-lg font-bold bg-gradient-to-r from-slate-900 to-indigo-900 bg-clip-text text-transparent">
							Ams Club Hub
						</span>
					</Link>

					{isLoggedIn ? (
						<div className="flex items-center gap-3">
							<span className="text-xs font-semibold px-3 py-1 bg-slate-100 text-slate-700 rounded-full hidden sm:inline-block">
								👋 Đã đăng nhập
							</span>
							<button
								onClick={handleLogout}
								className="px-3.5 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 active:scale-95 rounded-lg transition-all"
							>
								Đăng xuất
							</button>
						</div>
					) : (
						<Link
							href="/login"
							className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-lg shadow-md shadow-indigo-200 transition-all"
						>
							Đăng nhập
						</Link>
					)}
				</div>
			</header>

			{/* MAIN CONTENT */}
			<main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
				
				{/* SECTION 1: BÀI ĐĂNG */}
				<section>
					<div className="mb-3.5 flex items-center justify-between px-1">
						<h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
							<span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse"></span>
							Sự kiện & Bài đăng mới
						</h2>
					</div>

					<FBAutoSlider>
						{isLoading ? (
							Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)
						) : posts.length > 0 ? (
							posts.map((post) => (
								<div
									key={post.id}
									className="group w-[220px] sm:w-[245px] flex-shrink-0 bg-white border border-slate-200/80 rounded-2xl p-3 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
								>
									<div>
										{/* Header Bài viết */}
										<div className="flex items-center gap-2 mb-2.5">
											<img
												src={getFullImageUrl(post.club?.logo_url)}
												alt={post.club?.name || 'Club'}
												className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
											/>
											<div className="overflow-hidden">
												<h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
													{post.club?.name || 'Ams Club'}
												</h4>
												<p className="text-[10px] text-slate-400 font-medium">
													{post.created_at ? new Date(post.created_at).toLocaleDateString('vi-VN') : 'Mới đăng'}
												</p>
											</div>
										</div>

										{/* Tiêu đề bài viết */}
										<p className="text-xs text-slate-800 font-medium mb-2 line-clamp-1 leading-snug">
											{post.title || post.content || 'Bài viết mới'}
											<span className="font-semibold text-indigo-500 hover:underline cursor-pointer ml-1">
												Xem thêm
											</span>
										</p>

										{/* Ảnh bài viết 1:1 */}
										<div className="relative w-full aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-100">
											<img
												src={getFullImageUrl(post.image_url)}
												alt={post.title || "Post image"}
												className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
											/>
										</div>
									</div>
								</div>
							))
						) : (
							<div className="text-xs text-slate-400 py-8 text-center w-full bg-slate-50 rounded-2xl border border-dashed border-slate-200">
								Chưa có bài đăng nào
							</div>
						)}
					</FBAutoSlider>
				</section>


				{/* SECTION 2: GỢI Ý CÂU LẠC BỘ (TÍCH HỢP LOGO ĐÈ BANNER) */}
				<section>
					<div className="mb-3.5 flex items-center justify-between px-1">
						<h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
							<span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
							Gợi ý câu lạc bộ
						</h2>
					</div>

					<FBAutoSlider>
						{isLoading ? (
							Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)
						) : clubs.length > 0 ? (
							clubs.map((club) => (
								<div
									key={club.id}
									className="group w-[230px] sm:w-[255px] flex-shrink-0 bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 flex flex-col justify-between"
								>
									{/* Banner Tỷ lệ 16:7 */}
									<div className="relative w-full aspect-[16/7] bg-slate-100 overflow-hidden">
										<img
											src={getFullImageUrl(club.banner_url)}
											alt={club.name}
											className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
										/>
										<div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
									</div>

									{/* Body chứa Logo đè & Thông tin */}
									<div className="relative px-3.5 pb-3.5 pt-7 flex flex-col justify-between flex-1">
										
										{/* Logo tròn đè lên góc trái Banner */}
										<div className="absolute -top-6 left-3.5">
											<div className="w-12 h-12 rounded-full border-2 border-white bg-white shadow-md overflow-hidden shrink-0">
												<img
													src={getFullImageUrl(club.logo_url)}
													alt={club.name}
													className="w-full h-full object-cover"
												/>
											</div>
										</div>

										{/* Mã CLB (Badge) góc phải nếu có */}
										{club.code && (
											<div className="absolute top-2 right-3">
												<span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200/60 uppercase tracking-wider">
													#{club.code}
												</span>
											</div>
										)}

										{/* Tên & Số người theo dõi */}
										<div className="space-y-1">
											<h3 className="font-bold text-xs sm:text-sm text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
												{club.name}
											</h3>
											<p className="text-[11px] text-slate-500 truncate">
												{club.followers_count || 0} người theo dõi • <span className="font-medium text-slate-600">{club.category || 'CLB Ams'}</span>
											</p>
										</div>

										{/* Nút Xem Chi Tiết */}
										<div className="pt-3 mt-1">
											<Link
												href={`/clubs/${club.id}`}
												className="block w-full text-center py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
											>
												Xem chi tiết
											</Link>
										</div>

									</div>
								</div>
							))
						) : (
							<div className="text-xs text-slate-400 py-8 text-center w-full bg-slate-50 rounded-2xl border border-dashed border-slate-200">
								Chưa có câu lạc bộ nào
							</div>
						)}
					</FBAutoSlider>
				</section>

			</main>
		</div>
	);
}

// --- COMPONENT AUTO SLIDER TỰ ĐỘNG HIỂN THỊ 3 FULL + 2 NỬA Ô ---
function FBAutoSlider({ children }: { children: React.ReactNode }) {
	const scrollRef = useRef<HTMLDivElement>(null);
	const [canScrollLeft, setCanScrollLeft] = useState(false);
	const [canScrollRight, setCanScrollRight] = useState(true);

	const updateScrollState = () => {
		if (!scrollRef.current) return;
		const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
		setCanScrollLeft(scrollLeft > 5);
		setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
	};

	useEffect(() => {
		const el = scrollRef.current;
		if (!el) return;

		el.addEventListener('scroll', updateScrollState);
		updateScrollState();

		// AUTO SCROLL SANG PHẢI SAU MỖI 10 GIÂY
		const timer = setInterval(() => {
			if (!scrollRef.current) return;
			const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;

			if (scrollLeft + clientWidth >= scrollWidth - 10) {
				scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
			} else {
				scrollRef.current.scrollBy({ left: 255, behavior: 'smooth' });
			}
		}, 7000);

		return () => {
			el.removeEventListener('scroll', updateScrollState);
			clearInterval(timer);
		};
	}, [children]);

	const handleManualScroll = (direction: 'left' | 'right') => {
		if (!scrollRef.current) return;
		const scrollAmount = direction === 'left' ? -255 : 255;
		scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
	};

	return (
		<div className="relative group/slider">
			{/* HIỆU ỨNG FADE LẤP LÓ HAI BÊN TRÁI VÀ PHẢI */}
			<div className="absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-slate-100 to-transparent z-10 pointer-events-none" />
			<div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-slate-100 to-transparent z-10 pointer-events-none" />

			{/* NÚT SCROLL TRÁI */}
			{canScrollLeft && (
				<button
					onClick={() => handleManualScroll('left')}
					aria-label="Previous"
					className="absolute left-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 shadow-md border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-white hover:scale-110 active:scale-95 transition-all text-xs opacity-0 group-hover/slider:opacity-100"
				>
					❮
				</button>
			)}

			{/* NÚT SCROLL PHẢI */}
			{canScrollRight && (
				<button
					onClick={() => handleManualScroll('right')}
					aria-label="Next"
					className="absolute right-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 shadow-md border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-white hover:scale-110 active:scale-95 transition-all text-xs opacity-0 group-hover/slider:opacity-100"
				>
					❯
				</button>
			)}

			{/* CONTAINER CHỨA CÁC THẺ CARD (PX-10 ĐỂ TẠO KHOẢNG HỞ LẮP LÓ NỬA Ô 2 BÊN) */}
			<div
				ref={scrollRef}
				className="flex gap-3.5 overflow-x-auto scroll-smooth py-1 px-10 no-scrollbar select-none"
				style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
			>
				{children}
			</div>
		</div>
	);
}

// UI SKELETON KHI ĐANG LOADING
function CardSkeleton() {
	return (
		<div className="w-[220px] sm:w-[245px] h-[310px] flex-shrink-0 bg-white border border-slate-200/60 rounded-xl p-3 animate-pulse flex flex-col justify-between">
			<div className="space-y-2">
				<div className="flex items-center gap-2">
					<div className="w-7 h-7 bg-slate-200 rounded-full" />
					<div className="w-24 h-3 bg-slate-200 rounded" />
				</div>
				<div className="w-full h-3 bg-slate-200 rounded" />
				<div className="w-full aspect-square bg-slate-200 rounded-lg" />
			</div>
		</div>
	);
}

