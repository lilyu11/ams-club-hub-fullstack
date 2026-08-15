'use client';

import SidebarLeft from '@/components/SidebarLeft';
import SidebarRight from '@/components/SidebarRight';
import { usePathname } from 'next/navigation';

export default function MainLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const pathname = usePathname();
	const isClubsPage = pathname === '/clubs';
	const isEventsPage = pathname === '/events';

	return (
		<div className="flex min-h-screen justify-center bg-background text-foreground">
			{/* Container giới hạn chiều rộng tối đa của toàn bộ trang */}
			<div className="flex w-full max-w-[1280px] justify-between">
				
				{/* Thanh bên trái - Cố định khi cuộn trang */}
				<aside className="sticky top-0 h-screen w-16 xl:w-64 shrink-0 border-r border-border p-4">
					<SidebarLeft />
				</aside>

				{/* Cột nội dung ở giữa - Mở rộng tràn khung khi ở /clubs */}
				<main
					className={`min-h-screen flex-1 border-r border-border transition-all duration-200 ${
						isClubsPage || isEventsPage ? 'max-w-none' : 'max-w-[600px]'
					}`}
				>
					{children}
				</main>

				{/* Thanh bên phải - Ẩn đi khi truy cập trang /clubs */}
				{!(isClubsPage || isEventsPage) && (
					<aside className="sticky top-0 hidden h-screen w-80 shrink-0 p-4 lg:block">
						<SidebarRight />
					</aside>
				)}
			</div>
		</div>
	);
}