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
			{/* Đổi justify-between -> justify-center và max-w-[1176px] để 3 cột ép sát nhau */}
			<div className="flex w-full max-w-[1176px] justify-center">
				
				{/* Thanh bên trái - Cố định khi cuộn trang */}
				<aside className="sticky top-0 h-screen w-16 xl:w-64 shrink-0 border-r border-border p-4">
					<SidebarLeft />
				</aside>

				{/* Cột nội dung ở giữa */}
				<main
					className={`min-h-screen flex-1 flex flex-col border-r border-border transition-all duration-200 w-full ${
						isClubsPage || isEventsPage ? 'max-w-none' : 'max-w-[600px]'
					}`}
				>
					{children}
				</main>

				{/* Thanh bên phía phải - Ẩn đi khi truy cập trang /clubs hoặc /events */}
				{!(isClubsPage || isEventsPage) && (
					<aside className="sticky top-0 hidden h-screen w-80 shrink-0 p-4 lg:block">
						<SidebarRight />
					</aside>
				)}
			</div>
		</div>
	);
}