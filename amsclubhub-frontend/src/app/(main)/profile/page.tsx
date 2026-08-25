'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, CreditCard, Shield, Mail, Activity, LogOut, LogIn, Loader2 } from 'lucide-react';
import api from '@/lib/api';

interface UserProfile {
	full_name?: string;
	student_id?: string;
	email?: string;
	role?: string;
	created_at?: string;
}

export default function ProfilePage() {
	const router = useRouter();
	const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
	const [user, setUser] = useState<UserProfile | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);

useEffect(() => {
    const fetchUserProfile = async () => {
      const token = localStorage.getItem('access_token');

      if (!token) {
        setIsLoggedIn(false);
        setIsLoading(false);
        return;
      }

      setIsLoggedIn(true);

      try {
        const userRes = await api.get('/users/me');
        setUser(userRes.data);
      } catch (e) {
        console.log('Chưa kết nối API /users/me hoặc token hết hạn.');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

	const handleLogout = () => {
		localStorage.removeItem('access_token');
		localStorage.removeItem('user_info');
		setIsLoggedIn(false);
		setUser(null);
	};

	const handleLogin = () => {
		router.push('/login');
	};

	// API không trả về created_at nên tạm thời comment 
	// const formatDate = (dateString?: string) => {
	// 	if (!dateString) return 'Không có';
	// 	try {
	// 		const date = new Date(dateString);
	// 		return new Intl.DateTimeFormat('vi-VN', {
	// 			day: '2-digit',
	// 			month: '2-digit',
	// 			year: 'numeric',
	// 		}).format(date);
	// 	} catch {
	// 		return dateString;
	// 	}
	// };

	const ROLE_MAP: Record<string, string> = {
		student: 'Học sinh',
		club_admin: 'Admin Câu lạc bộ',
		super_admin: 'Vua',
	};
	const displayRole = ROLE_MAP[user?.role || user?.role || 'Không có']

	const profileRows = [
		{
			label: 'Họ và tên',
			value: isLoggedIn ? user?.full_name || 'Không có' : 'Không tìm thấy',
			icon: User,
		},
		{
			label: 'Mã tài khoản',
			value: isLoggedIn ? user?.student_id || 'Không có' : 'Không tìm thấy',
			icon: CreditCard,
		},
		{
			label: 'Vai trò',
			value: isLoggedIn ? displayRole || 'Không có' : 'Không tìm thấy',
			icon: Shield,
		},
		{
			label: 'Email',
			value: isLoggedIn ? user?.email || 'Không có' : 'Không tìm thấy',
			icon: Mail,
		},
		{
			label: 'Trạng thái tài khoản',
			value: isLoggedIn ? 'Đã đăng nhập' : 'Chưa đăng nhập',
			icon: Activity,
			isStatus: true,
		},
	];

	if (isLoading) {
		return (
			<div className="min-h-[60vh] flex items-center justify-center">
				<Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="p-4 sm:p-6 w-full space-y-6 min-h-screen pb-20">
			{/* Header */}
			<div className="flex items-center gap-3">
				<div className="p-2.5 bg-primary/10 text-primary rounded-2xl shrink-0">
					<User className="w-6 h-6" />
				</div>
				<div>
					<h1 className="text-xl sm:text-2xl font-bold text-foreground">Hồ sơ cá nhân</h1>
					{/* <p className="text-xs text-muted-foreground">
						Chi tiết thông tin tài khoản và trạng thái truy cập
					</p> */}
				</div>
			</div>

			{/* Khung thông tin kéo dài toàn bộ chiều rộng */}
			<div className="bg-card/50 border border-border rounded-2xl divide-y divide-border overflow-hidden shadow-sm w-full">
				{profileRows.map((item, index) => {
					const Icon = item.icon;
					return (
						<div
							key={index}
							className="flex items-center justify-between p-4 sm:p-4 text-xs sm:text-sm hover:bg-muted/20 transition-colors"
						>
							<div className="flex items-center gap-3 text-muted-foreground shrink-0">
								<Icon className="w-4 h-4 shrink-0" />
								<span className="font-medium text-foreground">{item.label}</span>
							</div>

							<div className="text-right min-w-0">
								{item.isStatus ? (
									<span
										className={`font-semibold text-xs sm:text-sm ${
											isLoggedIn
												? 'text-emerald-500 dark:text-emerald-400'
												: 'text-red-500 dark:text-red-400'
										}`}
									>
										{item.value}
									</span>
								) : (
									<span
										className={`truncate block ${
											item.value === 'Không có'
												? 'text-muted-foreground/40 font-normal'
												: 'text-muted-foreground font-medium'
										}`}
									>
										{item.value}
									</span>
								)}
							</div>
						</div>
					);
				})}
			</div>

			{/* Nút đăng xuất / đăng nhập */}
			<div className="flex justify-end pt-1">
				{isLoggedIn ? (
					<button
						type="button"
						onClick={handleLogout}
						className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl text-xs sm:text-sm transition shadow-sm active:scale-95"
					>
						<LogOut className="w-4 h-4" />
						<span>Đăng xuất</span>
					</button>
				) : (
					<button
						type="button"
						onClick={handleLogin}
						className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:opacity-90 text-primary-foreground font-medium rounded-xl text-xs sm:text-sm transition shadow-sm active:scale-95"
					>
						<LogIn className="w-4 h-4" />
						<span>Đăng nhập</span>
					</button>
				)}
			</div>
		</div>
	);
}