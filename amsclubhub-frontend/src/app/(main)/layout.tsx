import SidebarLeft from '@/components/SidebarLeft';
import SidebarRight from '@/components/SidebarRight';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen justify-center bg-background text-foreground">
      {/* Container giới hạn chiều rộng tối đa của toàn bộ trang */}
      <div className="flex w-full max-w-[1280px] justify-between">
        
        {/* 1. Thanh bên trái - Cố định khi cuộn trang */}
        <aside className="sticky top-0 h-screen w-16 xl:w-64 shrink-0 border-r border-border p-4">
          <SidebarLeft/>
        </aside>

        {/* 2. Cột nội dung ở giữa - Cuộn độc lập */}
        <main className="min-h-screen flex-1 max-w-[600px] border-r border-border">
          {children}
        </main>

        {/* 3. Thanh bên phải - Cố định & Tự ẩn trên màn hình nhỏ */}
        <aside className="sticky top-0 hidden h-screen w-80 shrink-0 p-4 lg:block">
          <SidebarRight/>
        </aside>

      </div>
    </div>
  );
}