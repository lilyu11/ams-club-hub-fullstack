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
} from 'lucide-react';

const NAV_ITEMS = [
	{ name: 'Trang chủ', href: '/', icon: Home },
	{ name: 'Câu lạc bộ', href: '/clubs', icon: Compass },
	{ name: 'Sự kiện', href: '/events', icon: Flame },
	{ name: 'Thông báo', href: '/notifications', icon: Bell },
	{ name: 'Hồ sơ', href: '/profile', icon: CircleUser },
	{ name: 'Cài đặt', href: '/settings', icon: Settings },
];

interface SidebarLeftProps {
	isMobile?: boolean;
}

export default function SidebarLeft({ isMobile = false }: SidebarLeftProps) {
	const pathname = usePathname();
	const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

	useEffect(() => {
		const token = localStorage.getItem('token') || localStorage.getItem('access_token');
		setIsLoggedIn(!!token);
	}, [pathname]);

	return (
		<div className="flex flex-col justify-between h-full py-2">
			<div className="space-y-6">
				{/* Trên Mobile đã có logo ở Header Drawer nên ẩn phần logo này đi */}
				{!isMobile && (
					<Link
						href="/"
						className="flex items-center justify-center lg:justify-start gap-3 px-2 lg:px-3 text-primary font-black text-2xl tracking-tight hover:opacity-90 transition"
					>
						<Sparkles className="w-7 h-7 shrink-0 fill-primary" />
						<span className="hidden lg:inline">AmsClubHub</span>
					</Link>
				)}

				{/* Menu điều hướng */}
				<nav className="space-y-1">
					{NAV_ITEMS.map((item) => {
						const Icon = item.icon;
						const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

						return (
							<Link
								key={item.href}
								href={item.href}
								className={`flex items-center gap-4 px-3 py-3 rounded-full text-base font-medium transition-colors ${isMobile ? 'justify-start' : 'justify-center lg:justify-start'
									} ${isActive
										? 'font-bold text-foreground bg-muted/60'
										: 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
									}`}
							>
								<Icon className={`w-6 h-6 shrink-0 ${isActive ? 'text-primary stroke-[2.5]' : ''}`} />
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