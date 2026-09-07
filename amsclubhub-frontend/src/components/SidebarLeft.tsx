'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
	Home,
	Compass,
	Bell,
	Settings,
	Sparkles,
	Flame,
	CircleUser,
	KeyRound,
	CircleQuestionMark,
} from 'lucide-react';
import api from '@/lib/api';
import { cachedGet } from '@/lib/requestCache';

const BASE_NAV_ITEMS = [
	{ name: 'Trang chủ', href: '/', icon: Home },
	{ name: 'Câu lạc bộ', href: '/clubs', icon: Compass },
	{ name: 'Sự kiện', href: '/events', icon: Flame },
	{ name: 'Thông báo', href: '/notifications', icon: Bell },
	{ name: 'Hồ sơ', href: '/profile', icon: CircleUser },
	{ name: 'Cài đặt', href: '/settings', icon: Settings },
	{ name: 'Hướng dẫn', href: '/guides', icon: CircleQuestionMark },
];

interface SidebarLeftProps {
	isMobile?: boolean;
}

export default function SidebarLeft({ isMobile = false }: SidebarLeftProps) {
	const pathname = usePathname();
	const [myClubSlug, setMyClubSlug] = useState<string | null>(null);

	useEffect(() => {
		const token = localStorage.getItem('token') || localStorage.getItem('access_token');
		if (!token) {
			setMyClubSlug(null);
			return;
		}

		const fetchUser = async () => {
			try {
				const user = await cachedGet('/users/me');

				// Chỉ hiển thị khi là club_admin và backend trả về club_slug hợp lệ
				if (user?.role?.toLowerCase() === 'club_admin' && user?.club_slug) {
					setMyClubSlug(user.club_slug);
				} else {
					setMyClubSlug(null);
				}
			} catch (err) {
				console.error('Lỗi lấy thông tin user ở Sidebar:', err);
				setMyClubSlug(null);
			}
		};

		fetchUser();
		// Chỉ fetch khi mount (tránh gọi /users/me lại mỗi lần chuyển trang)
	}, []);

	// Tạo danh sách nav dynamic
	const navItems = [...BASE_NAV_ITEMS];

	// Nút 'Câu lạc bộ của tôi' chèn vào vị trí số 3 (ngay dưới "Câu lạc bộ")
	if (myClubSlug) {
		navItems.splice(2, 0, {
			name: 'Câu lạc bộ của tôi',
			href: `/clubs/${myClubSlug}`,
			icon: KeyRound,
		});
	}

	return (
		<div className="flex flex-col justify-between h-full py-2">
			<div className="space-y-6">
				{!isMobile && (
					<Link
						href="/"
						prefetch={false}
						className="flex items-center justify-center lg:justify-start gap-3 px-2 lg:px-3 text-primary font-black text-2xl tracking-tight hover:opacity-90 transition"
					>
						<Sparkles className="w-7 h-7 shrink-0 fill-primary" />
						<span className="hidden lg:inline">AmsClubHub</span>
					</Link>
				)}

				<nav className="space-y-1">
					{navItems.map((item) => {
						const Icon = item.icon;

						const isActive = (() => {
							// Page chỉ sáng khi ở đúng page
							if (item.href === '/') {
								return pathname === '/';
							}

							// Nếu đang ở {/clubs/xyz} thì không làm sáng {/clubs}
							if (item.href === '/clubs' && myClubSlug && pathname.startsWith(`/clubs/${myClubSlug}`)) {
								return false;
							}

							// Các trang khác trùng khớp hoàn toàn hoặc là route con dạng /item/sub-route
							return pathname === item.href || pathname.startsWith(`${item.href}`);
						})();

						return (
							<Link
								key={item.href}
								href={item.href}
								prefetch={false}
								className={`flex items-center gap-4 px-3 py-3 rounded-full text-base font-medium transition-colors ${isMobile ? 'justify-start' : 'justify-center lg:justify-start'
									} ${isActive
										? 'font-bold text-foreground bg-muted/60'
										: 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
									}`}
							>
								<Icon
									className={`w-6 h-6 shrink-0 ${isActive ? 'text-primary stroke-[2.5]' : ''
										}`}
								/>
								<span className={isMobile ? 'inline' : 'hidden lg:inline'}>
									{item.name}
								</span>
							</Link>
						);
					})}
				</nav>
			</div>
		</div>
	);
}