'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
	Home, 
	Users, 
	Bell, 
	FileText, 
	Settings, 
	Sparkles,
	Save,
} from 'lucide-react';

const NAV_ITEMS = [
	{ name: 'Trang chủ', href: '/', icon: Home, requireAuth: false },
	{ name: 'Câu lạc bộ', href: '/clubs', icon: Users, requireAuth: false },
	{ name: 'Thông báo', href: '/notifications', icon: Bell, requireAuth: true },
	// { name: 'Bài đăng', href: '/posts', icon: FileText, requireAuth: false },
	{ name: 'Đã lưu', href: '/saved', icon: Save, requireAuth: true },
	{ name: 'Cài đặt', href: '/settings', icon: Settings, requireAuth: false },
];

export default function SidebarLeft() {
	const pathname = usePathname();
	const router = useRouter();
	const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

	// Kiểm tra trạng thái đăng nhập từ localStorage khi component mount
	useEffect(() => {
		// Tự động kiểm tra token
		const token = localStorage.getItem('token') || localStorage.getItem('access_token');
		setIsLoggedIn(!!token);
	}, [pathname]); // Check lại mỗi khi đổi route

	// Xử lý bấm vào menu yêu cầu đăng nhập
	const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, item: typeof NAV_ITEMS[0]) => {
		if (item.requireAuth && !isLoggedIn) {
			e.preventDefault(); // Chặn không cho sang trang khác ở navigation
			router.push('/login'); // Chuyển hướng về trang đăng nhập
		}
	};

	return (
		<div className="flex flex-col justify-between h-full py-2">
			{/* Logo & Navigation Links */}
			<div className="space-y-6">
				{/* Logo AmsClubHub */}
				<Link href="/" className="flex items-center gap-3 px-3 text-primary font-black text-2xl tracking-tight hover:opacity-90 transition">
					<Sparkles className="w-7 h-7 fill-primary" />
					<span className="hidden xl:inline">AmsClubHub</span>
				</Link>

				{/* Menu Điều Hướng */}
				<nav className="space-y-1">
					{NAV_ITEMS.map((item) => {
						const Icon = item.icon;
						const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

						return (
							<Link
								key={item.href}
								href={item.href}
								onClick={(e) => handleNavClick(e, item)}
								className={`flex items-center gap-4 px-3 py-3 rounded-full text-base font-medium transition-colors ${
									isActive
										? 'font-bold text-foreground bg-muted/60'
										: 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
								}`}
							>
								<Icon className={`w-6 h-6 ${isActive ? 'text-primary stroke-[2.5]' : ''}`} />
								<span className="hidden xl:inline">{item.name}</span>
							</Link>
						);
					})}
				</nav>
			</div>
		</div>
	);
}