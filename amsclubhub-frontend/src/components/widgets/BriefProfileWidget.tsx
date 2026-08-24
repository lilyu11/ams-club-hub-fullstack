'use client';

import { useState, useEffect } from 'react';
import { User, LogIn, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { getFullImageUrl } from '@/lib/utils';

interface UserProfile {
	id: number;
	full_name: string;
	role: string;
	avatar_url?: string;
}

const ROLE_MAP: Record<string, string> = {
	student: 'Học sinh',
	club_admin: 'Admin Câu lạc bộ',
	super_admin: 'Vua',
};

export default function BriefProfileWidget() {
	const [user, setUser] = useState<UserProfile | null>(null);
	const [loading, setLoading] = useState(true);
	const router = useRouter();

	useEffect(() => {
		const fetchCurrentUser = async () => {
			try {
				const res = await api.get('/users/me');
				setUser(res.data);
			} catch (err) {
				setUser(null);
			} finally {
				setLoading(false);
			}
		};

		fetchCurrentUser();
	}, []);

	const handleLogout = async () => {
		try {
			await api.post('/auth/logout').catch(() => { });
		} finally {
			localStorage.removeItem('token');
			localStorage.removeItem('access_token');
			document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
			setUser(null);
			router.push('/login');
			window.location.reload();
		}
	};

	if (loading) {
		return (
			<div className="p-3.5 border border-border rounded-2xl bg-card animate-pulse space-y-3">
				<div className="flex items-center gap-3">
					<div className="w-10 h-10 rounded-full bg-muted"></div>
					<div className="flex-1 space-y-2">
						<div className="h-3 bg-muted rounded w-3/4"></div>
						<div className="h-2 bg-muted rounded w-1/2"></div>
					</div>
				</div>
			</div>
		);
	}

	// KHI CHƯA ĐĂNG NHẬP
	if (!user) {
		return (
			<div className="p-3.5 border border-border rounded-2xl bg-card space-y-3">
				{/* ------------------------------------------------------- */}
				<div className="flex items-center justify-between gap-2">
					<div className="flex items-center gap-3 overflow-hidden min-w-0">
						<div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
							<User className="w-5 h-5" />
						</div>

						<div className="flex flex-col truncate">
							<span className="font-bold text-sm text-card-foreground truncate">
								User
							</span>
							<span className="text-xs text-muted-foreground truncate font-medium">
								Chưa đăng nhập
							</span>
						</div>
					</div>

					{/* Tag "Offline" */}
					<span className="text-[10px] bg-slate-500/10 text-slate-500 font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5 shrink-0">
						<span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-pulse"></span>
						Offline
					</span>
				</div>
				<Link
					href="/login"
					className="flex items-center justify-center gap-2 w-full text-xs bg-primary text-primary-foreground font-semibold px-3 py-2 rounded-xl hover:opacity-90 transition shadow-sm"
				>
					<LogIn className="w-3.5 h-3.5" />
					Đăng nhập
				</Link>
			</div>
		);
	}

	const displayRole = ROLE_MAP[user.role] || user.role || 'Thành viên';

	// KHI ĐÃ ĐĂNG NHẬP
	return (
		<div className="p-3.5 border border-border rounded-2xl bg-card space-y-3">
			{/* Profile User + Tag Trạng thái bên phải */}
			<div className="flex items-center justify-between gap-2">
				<div className="flex items-center gap-3 overflow-hidden min-w-0">
					{user.avatar_url ? (
						<img
							src={getFullImageUrl(user.avatar_url)}
							alt={user.full_name}
							className="w-10 h-10 rounded-full object-cover shrink-0 border border-border"
						/>
					) : (
						<div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
							<User className="w-5 h-5" />
						</div>
					)}

					<div className="flex flex-col truncate">
						<span className="font-bold text-sm text-card-foreground truncate">
							{user.full_name}
						</span>
						<span className="text-xs text-muted-foreground truncate font-medium">
							{displayRole}
						</span>
					</div>
				</div>

				{/* Tag "Online" */}
				<span className="text-[10px] bg-emerald-500/10 text-emerald-500 font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5 shrink-0">
					<span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
					Online
				</span>
			</div>

			{/* Nút Đăng xuất ở dưới */}
			<button
				onClick={handleLogout}
				className="flex items-center justify-center gap-2 w-full text-xs border border-border text-muted-foreground hover:text-destructive hover:border-destructive/40 hover:bg-destructive/10 font-medium px-3 py-1.5 rounded-xl transition"
			>
				<LogOut className="w-3.5 h-3.5" />
				Đăng xuất
			</button>
		</div>
	);
}