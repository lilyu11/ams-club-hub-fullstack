'use client';

import { useState, useEffect } from 'react';
import SidebarLeft from '@/components/SidebarLeft';
import SidebarRight from '@/components/SidebarRight';
import { usePathname } from 'next/navigation';
import { Menu, X, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isClubsPage = pathname === '/clubs';
  const isEventsPage = pathname === '/events';
  const isGuidesPage = pathname === '/guides';

  // Tự động đóng Menu Drawer khi chọn trang mới
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col md:flex-row justify-center bg-background text-foreground">
      {/* Header dành riêng cho MOBILE */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur-md md:hidden">
        <Link href="/" className="flex items-center gap-2 text-primary font-black text-xl">
          <Sparkles className="w-6 h-6 fill-primary" />
            <span>AmsClubHub</span>
        </Link>
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 rounded-xl text-muted-foreground hover:bg-muted/60 transition"
          aria-label="Mở Menu"
        >
          <Menu className="w-6 h-6 text-foreground" />
        </button>
      </header>

      {/* Menu Drawer dạng vuốt/trượt trên MOBILE */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Lớp nền mờ khi mở Menu */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Khung Menu vuốt ra từ lề trái */}
          <div className="relative w-72 max-w-[80%] bg-background h-full p-4 border-r border-border shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-2">
              <div className="flex items-center gap-2 text-primary font-black text-xl">
                <Sparkles className="w-6 h-6 fill-primary" />
                <span>AmsClubHub</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Render Sidebar truyền flag isMobile */}
            <SidebarLeft isMobile />
          </div>
        </div>
      )}

      {/* Bố cục 3 Cột dành cho DESKTOP */}
      <div className="flex w-full max-w-[1176px] justify-center">

        {/* Sidebar bên trái - Ẩn hoàn toàn trên Mobile (hidden), chỉ hiện từ md trở lên */}
        <aside className="sticky top-0 hidden h-screen w-16 lg:w-64 shrink-0 border-r border-border p-2 lg:p-4 md:block">
          <SidebarLeft />
        </aside>

        {/* Cột nội dung chính */}
        <main
          className={`min-h-screen flex-1 flex flex-col border-r border-border transition-all duration-200 w-full ${
            isClubsPage || isEventsPage || isGuidesPage ? 'max-w-none' : 'max-w-[600px]'
          }`}
        >
          {children}
        </main>

        {/* Sidebar bên phải - Chỉ hiện từ màn hình lớn (lg) */}
        {!(isClubsPage || isEventsPage || isGuidesPage) && (
          <aside className="sticky top-0 hidden h-screen w-80 shrink-0 p-4 lg:block">
            <SidebarRight />
          </aside>
        )}
      </div>
    </div>
  );
}