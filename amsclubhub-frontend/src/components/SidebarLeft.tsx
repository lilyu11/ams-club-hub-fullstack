'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
	{ name: 'Trang chủ', href: '/', icon: Home },
	{ name: 'Câu lạc bộ', href: '/clubs', icon: Users },
	{ name: 'Thông báo', href: '/notifications', icon: Bell },
	{ name: 'Bài đăng', href: '/posts', icon: FileText },
	{ name: 'Đã lưu', href: '/saved', icon: Save },
	{ name: 'Cài đặt', href: '/settings', icon: Settings },
];

export default function SidebarLeft() {
	const pathname = usePathname();

	return (
		<div className="flex flex-col justify-between h-full py-2">
			{/* 1. Logo & Navigation Links */}
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

			{/* 2. Nút Tạo bài viết nhanh */}
			<button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-full transition shadow-md hidden xl:block">
				Tạo bài đăng
			</button>
		</div>
	);
}