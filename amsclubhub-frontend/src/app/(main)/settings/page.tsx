'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Sliders, Sun, Moon, Laptop } from 'lucide-react';

export default function SettingsPage() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
	setMounted(true);
  }, []);

  const isDark = resolvedTheme === 'dark' || theme === 'dark';

  const toggleTheme = () => {
	setTheme(isDark ? 'light' : 'dark');
  };

  return (
	<div className="w-full p-4 sm:p-6 space-y-6">
	  {/* Header */}
	  <div className="flex items-center gap-3 border-b border-border pb-4 w-full">
		<div className="p-2.5 bg-primary/10 text-primary rounded-2xl">
		  <Sliders className="w-6 h-6" />
		</div>
		<div>
		  <h1 className="text-2xl font-bold text-foreground">Cài đặt</h1>
		  {/* <p className="text-xs text-muted-foreground">
			Quản lý giao diện và thiết lập tài khoản
		  </p> */}
		</div>
	  </div>

	  {/* Danh sách Cài đặt - Dạng Hàng (Row) trải rộng full cột */}
	  <div className="space-y-3 w-full">
		<div className="w-full bg-card border border-border rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 transition-all shadow-sm">
		  {/* Icon tùy chỉnh giao diện bên trái */}
		  <div className="flex items-center gap-3.5 min-w-0">
			<div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0">
			  {!mounted ? (
				<Laptop className="w-5 h-5 text-muted-foreground" />
			  ) : isDark ? (
				<Moon className="w-5 h-5 text-indigo-400" />
			  ) : (
				<Sun className="w-5 h-5 text-amber-500" />
			  )}
			</div>
			<div className="truncate">
			  <h3 className="text-sm font-bold text-foreground">Chế độ hiển thị</h3>
			  <p className="text-xs text-muted-foreground mt-0.5 truncate">
				{!mounted
				  ? 'Đang tải cài đặt giao diện...'
				  : isDark
				  ? 'Đang bật chế độ tối (Dark Mode)'
				  : 'Đang bật chế độ sáng (Light Mode)'}
			  </p>
			</div>
		  </div>

		  {/* Ô Toggle Switch bên phải */}
		  <div className="shrink-0 pl-2">
			{!mounted ? (
			  <div className="w-12 h-6 bg-muted rounded-full animate-pulse" />
			) : (
			  <button
				type="button"
				onClick={toggleTheme}
				aria-label="Chuyển đổi giao diện"
				className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
				  isDark ? 'bg-primary' : 'bg-muted'
				}`}
			  >
				<span
				  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform flex items-center justify-center shadow-md ${
					isDark ? 'translate-x-6' : 'translate-x-1'
				  }`}
				>
				  {/* {isDark ? (
					<Moon className="w-2.5 h-2.5 text-slate-900" />
				  ) : (
					<Sun className="w-2.5 h-2.5 text-amber-500" />
				  )} */}
				</span>
			  </button>
			)}
		  </div>
		</div>
	  </div>
	</div>
  );
}