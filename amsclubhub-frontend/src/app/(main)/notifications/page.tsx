'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
	Bell,
	Clock,
	Mail,
	Sparkles,
	Loader2,
	Lock,
	LogIn,
	Trash2,
	X,
	CheckSquare,
	Square,
	AlertTriangle,
} from 'lucide-react';
import api from '@/lib/api';

export interface NotificationDisplayItem {
	id: string;
	title: string;
	message: string;
	time: string;
	type: 'club_post' | 'reminder';
	link: string;
	rawDate: string;
	postId?: string;
	hasDeadline?: boolean;
	clubLogo?: string;
	clubName?: string;
}

export default function NotificationsPage() {
	const router = useRouter();
	const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
	const [activeTab, setActiveTab] = useState<'all' | 'posts' | 'reminders'>('all');

	// Lưu trạng thái Auto-Reminder vào localStorage
	const [autoEmailReminder, setAutoEmailReminder] = useState<boolean>(() => {
		if (typeof window !== 'undefined') {
			const saved = localStorage.getItem('auto_email_reminder');
			return saved !== null ? JSON.parse(saved) : true;
		}
		return true;
	});

	const [notifications, setNotifications] = useState<NotificationDisplayItem[]>([]);
	const [loading, setLoading] = useState<boolean>(true);

	// State quản lý chọn & xóa reminder
	const [isSelectMode, setIsSelectMode] = useState<boolean>(false);
	const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);
	const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState<boolean>(false);
	const [isDeleting, setIsDeleting] = useState<boolean>(false);

	// Kiểm tra token khi vừa truy cập trang
	useEffect(() => {
		const checkAuth = () => {
			const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
			setIsAuthenticated(!!token);
		};
		checkAuth();
	}, []);

	// Hàm chuyển đổi định dạng thời gian
	const formatTime = (dateStr?: string) => {
		if (!dateStr) return 'Mới đây';
		try {
			let formattedStr = dateStr.replace(' ', 'T');
			if (!formattedStr.endsWith('Z') && !formattedStr.includes('+')) {
				formattedStr += 'Z';
			}
			const pastTime = new Date(formattedStr).getTime();
			const now = Date.now();
			const diffInSeconds = Math.floor((now - pastTime) / 1000);

			if (diffInSeconds < 60) return 'Vừa xong';
			const minutes = Math.floor(diffInSeconds / 60);
			if (minutes < 60) return `${minutes} phút trước`;
			const hours = Math.floor(minutes / 60);
			if (hours < 24) return `${hours} giờ trước`;
			return new Date(formattedStr).toLocaleDateString('vi-VN');
		} catch {
			return 'Mới đây';
		}
	};

	const isNew = (dateString: string) => {
		const diffInMs = new Date().getTime() - new Date(dateString).getTime();
		const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
		return diffInDays < 3;
	};

	const handleToggleAutoReminder = (checked: boolean) => {
		setAutoEmailReminder(checked);
		if (typeof window !== 'undefined') {
			localStorage.setItem('auto_email_reminder', JSON.stringify(checked));
		}
	};

	// Tải dữ liệu API (Chỉ thực thi khi đã xác thực)
	const fetchAllNotifications = useCallback(async () => {
		if (!isAuthenticated) return;

		setLoading(true);
		try {
			const combinedItems: NotificationDisplayItem[] = [];
			const now = Date.now();
			const THREE_WEEKS_MS = 21 * 24 * 60 * 60 * 1000;

			const followedClubsMap = new Map<string, any>();
			let followedClubs: any[] = [];
			try {
				const followedRes = await api.get('/clubs/followed/me', { params: { limit: 100 } });
				followedClubs = Array.isArray(followedRes.data)
					? followedRes.data
					: followedRes.data?.items || [];

				followedClubs.forEach((club: any) => {
					if (club.id) followedClubsMap.set(club.id, club);
				});
			} catch (e) {
				console.error('Lỗi tải danh sách CLB đã follow:', e);
			}

			const allClubsMap = new Map<string, any>();
			try {
				const clubs = await api.get('/clubs', { params: { limit: 100 } });
				const allClubs = Array.isArray(clubs.data) ? clubs.data : clubs.data?.items || [];
				allClubs.forEach((club: any) => {
					if (club.id) allClubsMap.set(club.id, club);
				});
			} catch (e) {
				console.error('Lỗi tải danh sách tất cả CLB:', e);
			}

			const existingRemindedPostIds = new Set<string>();
			try {
				const remindersRes = await api.get('/reminders/me');
				const remindersList = Array.isArray(remindersRes.data)
					? remindersRes.data
					: remindersRes.data?.items || [];

				remindersList.forEach((rem: any) => {
					if (rem.campaign_post_id) {
						existingRemindedPostIds.add(rem.campaign_post_id);
					}
					const campaignPost = rem.campaign_post;
					const targetClub = campaignPost?.club_id ? allClubsMap.get(campaignPost.club_id) : null;

					combinedItems.push({
						id: `reminder_${rem.id}`,
						title: `${targetClub?.name || 'Câu lạc bộ'}`,
						message: `Thông báo về bài viết "${campaignPost?.title || 'Sự kiện'}" sẽ được gửi đến email của bạn.`,
						time: formatTime(rem.created_at || rem.scheduled_at),
						type: 'reminder' as const,
						link: `/posts/${rem.campaign_post_id}`,
						rawDate: rem.created_at || rem.scheduled_at || new Date().toISOString(),
						postId: rem.campaign_post_id,
						clubLogo: targetClub?.logo_url,
						clubName: targetClub?.name || 'Câu lạc bộ',
					});
				});
			} catch (e) {
				console.error('Lỗi tải danh sách Reminder:', e);
			}

			const postsPromises = followedClubs.map(async (club: any) => {
				try {
					const postsRes = await api.get('/posts', {
						params: { club_identifier: club.id || club.code },
					});
					const postsList = Array.isArray(postsRes.data)
						? postsRes.data
						: postsRes.data?.items || [];

					const validItems: NotificationDisplayItem[] = [];
					for (const post of postsList) {
						const postTime = new Date(post.created_at || post.date).getTime();
						if (now - postTime > THREE_WEEKS_MS) continue;

						const isDeadlineValid = post.deadline && new Date(post.deadline).getTime() > now;
						const hasBeenReminded = existingRemindedPostIds.has(post.id);

						if (autoEmailReminder && isDeadlineValid && !hasBeenReminded) {
							existingRemindedPostIds.add(post.id);
							api.post(`/posts/${post.id}/remind`).catch(() => { });
						}

						validItems.push({
							id: `post_${post.id}`,
							title: club.name || 'Câu lạc bộ',
							message: `đã đăng một bài viết mới: "${post.title}"`,
							time: formatTime(post.created_at),
							type: 'club_post' as const,
							link: `/posts/${post.id}`,
							rawDate: post.created_at || new Date().toISOString(),
							postId: post.id,
							hasDeadline: !!post.deadline,
							clubLogo: club.logo_url,
							clubName: club.name,
						});
					}
					return validItems;
				} catch {
					return [];
				}
			});

			const postsResults = await Promise.all(postsPromises);
			postsResults.forEach((items) => combinedItems.push(...items));

			combinedItems.sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());
			setNotifications(combinedItems);
		} catch (error) {
			console.error('Lỗi tổng hợp thông báo:', error);
		} finally {
			setLoading(false);
		}
	}, [autoEmailReminder, isAuthenticated]);

	useEffect(() => {
		if (isAuthenticated) {
			fetchAllNotifications();
		}
	}, [isAuthenticated, fetchAllNotifications]);

	// Các hàm xử lý chọn và xóa reminder
	const handleStartSelectMode = () => {
		setActiveTab('reminders');
		setIsSelectMode(true);
		setSelectedPostIds([]);
	};

	const handleCancelSelectMode = () => {
		setIsSelectMode(false);
		setSelectedPostIds([]);
	};

	const toggleSelectReminder = (postId?: string) => {
		if (!postId) return;
		setSelectedPostIds((prev) =>
			prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]
		);
	};

	const handleConfirmDelete = async () => {
		if (selectedPostIds.length === 0) return;

		setIsDeleting(true);
		try {
			// Gọi API xóa từng reminder đã chọn
			await Promise.all(
				selectedPostIds.map((postId) => api.delete(`/posts/${postId}/remind`))
			);

			// Reset trạng thái và tải lại dữ liệu mới
			setIsConfirmDialogOpen(false);
			setIsSelectMode(false);
			setSelectedPostIds([]);
			await fetchAllNotifications();
		} catch (error) {
			console.error('Lỗi khi xóa nhắc nhở:', error);
		} finally {
			setIsDeleting(false);
		}
	};

	const handleCardClick = (item: NotificationDisplayItem) => {
		// Nếu đang ở chế độ chọn và item là reminder thì toggle chọn
		if (isSelectMode && item.type === 'reminder') {
			toggleSelectReminder(item.postId);
			return;
		}
		// Ngược lại thì chuyển hướng bình thường
		if (item.link && item.link !== '#') {
			router.push(item.link);
		}
	};

	const filteredNotifications = notifications.filter((item) => {
		if (activeTab === 'posts') return item.type === 'club_post';
		if (activeTab === 'reminders') return item.type === 'reminder';
		return true;
	});

	// Hiển thị loading khi đang kiểm tra Auth ban đầu
	if (isAuthenticated === null) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[60vh]">
				<Loader2 className="w-8 h-8 animate-spin text-primary" />
			</div>
		);
	}

	// Giao diện Guest dành cho NGƯỜI DÙNG CHƯA ĐĂNG NHẬP
	if (!isAuthenticated) {
		return (
			<div className="flex-1 w-full flex flex-col items-center justify-start pt-12 sm:pt-16 px-4 text-center">
				<div className="max-w-md w-full flex flex-col items-center space-y-6">
					<div className="p-4 bg-primary/10 text-primary rounded-full">
						<Lock className="w-10 h-10" />
					</div>
					<div className="space-y-2">
						<h1 className="text-2xl font-bold text-foreground">Yêu cầu đăng nhập</h1>
						<p className="text-sm text-muted-foreground leading-relaxed">
							Bạn cần đăng nhập để xem thông báo cập nhật từ các câu lạc bộ đã theo dõi và quản lý lịch nhắc nhở email.
						</p>
					</div>
					<div className="flex items-center gap-3 pt-2 w-full max-w-xs">
						<button
							type="button"
							onClick={() => router.push('/login')}
							className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 transition-all text-sm shadow-sm"
						>
							<LogIn className="w-4 h-4" />
							Đăng nhập
						</button>
						<button
							type="button"
							onClick={() => router.push('/register')}
							className="flex-1 py-2.5 px-4 bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-xl transition-all text-sm"
						>
							Đăng ký
						</button>
					</div>
				</div>
			</div>
		);
	}

	// Giao diện chính cho NGƯỜI DÙNG ĐÃ ĐĂNG NHẬP
	return (
		<div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6 min-h-screen pb-20 relative">
			{/* Header */}
			<div className="flex items-center gap-3">
				<div className="p-2.5 bg-primary/10 text-primary rounded-2xl shrink-0">
					<Bell className="w-6 h-6" />
				</div>
				<div>
					<h1 className="text-xl sm:text-2xl font-bold text-foreground">Thông báo</h1>
					{/* <p className="text-xs text-muted-foreground">
						Cập nhật bài viết từ CLB đã theo dõi & Lịch nhắc nhở gửi về email
					</p> */}
				</div>
			</div>

			{/* Khung Auto-Reminder Email */}
			<div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div className="flex items-start gap-3 min-w-0">
					<div className="p-2 bg-primary text-primary-foreground rounded-xl mt-0.5 shrink-0">
						<Mail className="w-5 h-5" />
					</div>
					<div className="min-w-0">
						<h3 className="text-sm font-bold text-foreground flex items-center gap-2 flex-wrap">
							<span>Tự động đặt nhắc nhở</span>
							<span className="px-2 py-0.5 text-[10px] bg-primary/20 text-primary rounded-full font-semibold whitespace-nowrap">
								Nên dùng
							</span>
						</h3>
						<p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
							Tự động đăng ký lịch nhắc nhở gửi về email cho sự kiện / đơn tuyển thành viên mới từ các câu lạc bộ bạn đã theo dõi.
						</p>
					</div>
				</div>

				<label className="relative inline-flex items-center cursor-pointer self-end sm:self-auto shrink-0">
					<input
						type="checkbox"
						checked={autoEmailReminder}
						onChange={(e) => handleToggleAutoReminder(e.target.checked)}
						className="sr-only peer"
					/>
					<div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
				</label>
			</div>

			{/* Tabs Bộ lọc & Nút Xóa Reminder (Góc phải) */}
			<div className="flex items-center justify-between border-b border-border pb-3 gap-2">
				{/* Thanh Tabs hỗ trợ cuộn ngang mượt trên Mobile */}
				<div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar min-w-0 py-0.5">
					<button
						type="button"
						onClick={() => {
							setActiveTab('all');
							if (isSelectMode) handleCancelSelectMode();
						}}
						className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap shrink-0 ${activeTab === 'all'
								? 'bg-primary text-primary-foreground shadow-sm'
								: 'bg-muted/60 text-muted-foreground hover:text-foreground'
							}`}
					>
						Tất cả ({notifications.length})
					</button>
					<button
						type="button"
						onClick={() => {
							setActiveTab('posts');
							if (isSelectMode) handleCancelSelectMode();
						}}
						className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap shrink-0 ${activeTab === 'posts'
								? 'bg-primary text-primary-foreground shadow-sm'
								: 'bg-muted/60 text-muted-foreground hover:text-foreground'
							}`}
					>
						Bài viết mới ({notifications.filter((n) => n.type === 'club_post').length})
					</button>
					<button
						type="button"
						onClick={() => setActiveTab('reminders')}
						className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap shrink-0 ${activeTab === 'reminders'
								? 'bg-primary text-primary-foreground shadow-sm'
								: 'bg-muted/60 text-muted-foreground hover:text-foreground'
							}`}
					>
						Lịch nhắc nhở ({notifications.filter((n) => n.type === 'reminder').length})
					</button>
				</div>

				{/* Nút hành động Xóa nằm cố định ở góc phải */}
				<div className="flex items-center gap-2 shrink-0">
					{!isSelectMode ? (
						<button
							type="button"
							onClick={handleStartSelectMode}
							title="Xóa lịch nhắc nhở"
							className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all shrink-0"
						>
							<Trash2 className="w-4 h-4" />
						</button>
					) : (
						<div className="flex items-center gap-1.5 animate-in fade-in duration-200 shrink-0">
							<button
								type="button"
								onClick={handleCancelSelectMode}
								className="p-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted rounded-xl transition-all flex items-center gap-1 shrink-0"
							>
								<X className="w-4 h-4" />
								<span className="hidden sm:inline">Hủy</span>
							</button>
							<button
								type="button"
								disabled={selectedPostIds.length === 0}
								onClick={() => setIsConfirmDialogOpen(true)}
								className={`px-2.5 py-1.5 sm:px-3 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${selectedPostIds.length > 0
										? 'bg-red-600 hover:bg-red-700 text-white shadow-sm'
										: 'bg-red-600/50 text-white/70 cursor-not-allowed'
									}`}
							>
								<Trash2 className="w-3.5 h-3.5 shrink-0" />
								<span>Xóa {selectedPostIds.length > 0 ? `(${selectedPostIds.length})` : ''}</span>
							</button>
						</div>
					)}
				</div>
			</div>

			{/* Trạng thái loading */}
			{loading ? (
				<div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
					<Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
					<p className="text-xs">Đang tải thông báo...</p>
				</div>
			) : filteredNotifications.length === 0 ? (
				<div className="text-center py-16 bg-muted/20 border border-dashed border-border rounded-2xl">
					<Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
					<h3 className="text-base font-semibold text-foreground">
						Không có thông báo nào
					</h3>
					<p className="text-xs text-muted-foreground mt-1">
						Chưa có bài viết mới hoặc lịch nhắc nhở nào từ các CLB bạn đã theo dõi.
					</p>
				</div>
			) : (
				<div className="space-y-3">
					{filteredNotifications.map((item) => {
						const isItemNew = isNew(item.rawDate);
						const isSelected = !!item.postId && selectedPostIds.includes(item.postId);
						const isReminder = item.type === 'reminder';

						return (
							<div
								key={item.id}
								onClick={() => handleCardClick(item)}
								className={`group relative p-4 rounded-2xl border transition-all duration-200 flex items-start gap-4 cursor-pointer bg-card pr-10 ${isSelectMode && isReminder
										? isSelected
											? 'border-dashed border-red-500 bg-red-500/10 shadow-sm'
											: 'border-dashed border-border hover:border-red-400/50'
										: 'border-solid border-border hover:border-primary/40 hover:shadow-sm'
									}`}
							>

								<div className="relative shrink-0 mt-0.5">
									<img
										src={item.clubLogo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&auto=format&fit=crop&q=80'}
										alt={item.clubName || 'Club'}
										className="w-11 h-11 rounded-full object-cover border border-border"
									/>
									<div
										className={`absolute -bottom-1 -right-1 p-1 rounded-full border border-card ${item.type === 'reminder'
												? 'bg-amber-500 text-white'
												: 'bg-primary text-primary-foreground'
											}`}
									>
										{item.type === 'reminder' ? (
											<Clock className="w-3 h-3" />
										) : (
											<Bell className="w-3 h-3" />
										)}
									</div>
								</div>

								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2">
										<span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">
											{item.title}
										</span>
									</div>
									<p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
										{item.message}
									</p>
									<div className="flex items-center gap-4 mt-2.5 text-[11px] text-muted-foreground font-medium">
										<span>{item.time}</span>
									</div>
								</div>

								{isItemNew && !isSelectMode && (
									<div
										className="absolute top-3.5 right-3.5 text-amber-400 animate-pulse"
										title="Mới đăng"
									>
										<Sparkles className="w-4 h-4 fill-amber-400/20" />
									</div>
								)}
							</div>
						);
					})}
				</div>
			)}

			{/* Dialog xác nhận xóa reminder */}
			{isConfirmDialogOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
					<div className="bg-card border border-border w-full max-w-sm rounded-2xl p-5 shadow-2xl space-y-4">
						<div className="flex items-center gap-3 text-red-500">
							<div className="p-2.5 bg-red-500/10 rounded-xl">
								<AlertTriangle className="w-6 h-6" />
							</div>
							<h3 className="font-bold text-base text-foreground">
								Xóa {' '}
								<span className="font-bold text-foreground">
									{selectedPostIds.length}
								</span>{' '}
								nhắc nhở?
							</h3>
						</div>

						<p className="text-sm text-muted-foreground leading-relaxed">
							Bạn sẽ không còn nhận được email nhắc lịch cho sự kiện / bài viết này nữa.
						</p>

						<div className="flex items-center gap-2 pt-2 justify-end">
							<button
								type="button"
								disabled={isDeleting}
								onClick={() => setIsConfirmDialogOpen(false)}
								className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted rounded-xl transition-all"
							>
								Hủy bỏ
							</button>
							<button
								type="button"
								disabled={isDeleting}
								onClick={handleConfirmDelete}
								className="px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all flex items-center gap-2 shadow-sm"
							>
								{isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
								Xác nhận xóa
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}