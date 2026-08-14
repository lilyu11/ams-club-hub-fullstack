'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
	Bell,
	Clock,
	Mail,
	Sparkles,
	Loader2,
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

	// Hàm chuyển đổi định dạng thời gian
	const formatTimeAgo = (dateStr?: string) => {
		if (!dateStr) return 'Mới đây';
		try {
			const date = new Date(dateStr);
			const diff = Date.now() - date.getTime();
			const minutes = Math.floor(diff / (1000 * 60));
			const hours = Math.floor(diff / (1000 * 60 * 60));
			const days = Math.floor(hours / 24);

			if (minutes < 1) return 'Vừa xong';
			if (minutes < 60) return `${minutes} phút trước`;
			if (hours < 24) return `${hours} giờ trước`;
			if (days < 7) return `${days} ngày trước`;
			return date.toLocaleDateString('vi-VN');
		} catch {
			return 'Mới đây';
		}
	};

	// Hàm kiểm tra xem thông báo có dưới 3 ngày không
	const isNew = (dateString: string) => {
		const diffInMs = new Date().getTime() - new Date(dateString).getTime();
		const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
		return diffInDays < 3;
	};

	// Lưu cấu hình Auto Reminder
	const handleToggleAutoReminder = (checked: boolean) => {
		setAutoEmailReminder(checked);
		if (typeof window !== 'undefined') {
			localStorage.setItem('auto_email_reminder', JSON.stringify(checked));
		}
	};

	// Tải dữ liệu thực tế từ 2 luồng API
	const fetchAllNotifications = useCallback(async () => {
		setLoading(true);
		try {
			const combinedItems: NotificationDisplayItem[] = [];
			const now = Date.now();
			const THREE_WEEKS_MS = 21 * 24 * 60 * 60 * 1000; // 21 ngày

			// Lấy danh sách CLB đã follow trước & tạo map tra cứu theo ID
			const clubsMap = new Map<string, any>();
			let followedClubs: any[] = [];

			try {
				const followedRes = await api.get('/clubs/followed/me');
				followedClubs = Array.isArray(followedRes.data)
					? followedRes.data
					: followedRes.data?.items || [];

				// Lưu CLB vào map với key là club.id
				followedClubs.forEach((club: any) => {
					if (club.id) clubsMap.set(club.id, club);
				});
			} catch (e) {
				console.error('Lỗi tải danh sách CLB đã follow:', e);
			}

			// Tải danh sách Reminders & Ghép Logo CLB dựa vào campaign_post.club_id
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
					// Tra cứu CLB tạo ra bài đăng có deadline này:
					const targetClub = campaignPost?.club_id ? clubsMap.get(campaignPost.club_id) : null;

					combinedItems.push({
						id: `reminder_${rem.id}`,
						title: `${targetClub?.name}`,
						message: `Thông báo về bài viết "${campaignPost?.title || 'Sự kiện'}" sẽ được gửi đến email của bạn 12h trước khi hết hạn đăng ký.`,
						time: formatTimeAgo(rem.created_at || rem.scheduled_at),
						type: 'reminder' as const,
						link: `/posts/${rem.campaign_post_id}`,
						rawDate: rem.created_at || rem.scheduled_at || new Date().toISOString(),
						postId: rem.campaign_post_id,
						// Gán avatar và tên của CLB đặt reminder
						clubLogo: targetClub?.logo_url,
						clubName: targetClub?.name || 'Câu lạc bộ',
					});
				});
			} catch (e) {
				console.error('Lỗi tải danh sách Reminder:', e);
			}

			// Tải bài viết từ các CLB đã follow
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

						// Lọc bỏ bài viết cũ hơn 21 ngày
						if (now - postTime > THREE_WEEKS_MS) continue;

						// Kiểm tra Auto-Remind
						const isDeadlineValid = post.deadline && new Date(post.deadline).getTime() > now;
						const hasBeenReminded = existingRemindedPostIds.has(post.id);

						if (autoEmailReminder && isDeadlineValid && !hasBeenReminded) {
							existingRemindedPostIds.add(post.id);
							api.post(`/posts/${post.id}/remind`).catch(() => {});
						}

						validItems.push({
							id: `post_${post.id}`,
							title: club.name || 'Câu lạc bộ',
							message: `đã đăng một bài viết mới: "${post.title}"`,
							time: formatTimeAgo(post.created_at),
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

			// Sắp xếp theo thời gian mới nhất
			combinedItems.sort(
				(a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime()
			);

			setNotifications(combinedItems);
		} catch (error) {
			console.error('Lỗi tổng hợp thông báo:', error);
		} finally {
			setLoading(false);
		}
	}, [autoEmailReminder]);

	useEffect(() => {
		fetchAllNotifications();
	}, [fetchAllNotifications]);

	// Bấm trực tiếp vào bất kỳ vị trí nào trên Card -> Chuyển đến bài viết
	const handleCardClick = (link: string) => {
		if (link && link !== '#') {
			router.push(link);
		}
	};

	// Lọc thông báo theo Tab
	const filteredNotifications = notifications.filter((item) => {
		if (activeTab === 'posts') return item.type === 'club_post';
		if (activeTab === 'reminders') return item.type === 'reminder';
		return true;
	});

	return (
		<div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6 min-h-screen pb-20">
			{/* Header Trang */}
			<div className="flex items-center gap-3">
				<div className="p-2.5 bg-primary/10 text-primary rounded-2xl">
					<Bell className="w-6 h-6" />
				</div>
				<div>
					<h1 className="text-2xl font-bold text-foreground">Thông báo</h1>
					<p className="text-xs text-muted-foreground">
						Cập nhật bài viết từ CLB đã theo dõi & Lịch nhắc nhở gửi về email
					</p>
				</div>
			</div>

			{/* Khung Auto-Reminder Email */}
			<div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div className="flex items-start gap-3">
					<div className="p-2 bg-primary text-primary-foreground rounded-xl mt-0.5 shrink-0">
						<Mail className="w-5 h-5" />
					</div>
					<div>
						<h3 className="text-sm font-bold text-foreground flex items-center gap-2">
							Tự động đặt nhắc nhở
							<span className="px-2 py-0.5 text-[10px] bg-primary/20 text-primary rounded-full font-semibold">
								Bật tự động
							</span>
						</h3>
						<p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
							Tự động đăng ký lịch nhắc nhở gửi về email cho bài viết mới có deadline từ các CLB bạn đã theo dõi.
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

			{/* Tabs Bộ lọc */}
			<div className="flex items-center justify-between border-b border-border pb-3">
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={() => setActiveTab('all')}
						className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all ${
							activeTab === 'all'
								? 'bg-primary text-primary-foreground shadow-sm'
								: 'bg-muted/60 text-muted-foreground hover:text-foreground'
						}`}
					>
						Tất cả ({notifications.length})
					</button>
					<button
						type="button"
						onClick={() => setActiveTab('posts')}
						className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all ${
							activeTab === 'posts'
								? 'bg-primary text-primary-foreground shadow-sm'
								: 'bg-muted/60 text-muted-foreground hover:text-foreground'
						}`}
					>
						Bài viết mới ({notifications.filter((n) => n.type === 'club_post').length})
					</button>
					<button
						type="button"
						onClick={() => setActiveTab('reminders')}
						className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all ${
							activeTab === 'reminders'
								? 'bg-primary text-primary-foreground shadow-sm'
								: 'bg-muted/60 text-muted-foreground hover:text-foreground'
						}`}
					>
						Lịch nhắc nhở ({notifications.filter((n) => n.type === 'reminder').length})
					</button>
				</div>
			</div>

			{/* Trang Thái loading */}
			{loading ? (
				<div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
					<Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
					<p className="text-xs">Đang tải thông báo...</p>
				</div>
			) : filteredNotifications.length === 0 ? (
				/* Empty State */
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
				/* Danh sách Thông báo */
				<div className="space-y-3">
					{filteredNotifications.map((item) => {
						// Kiểm tra thông báo dưới 3 ngày (dùng created_at hoặc field chứa thời gian tạo của bạn)
						const isItemNew = isNew(item.rawDate);

						return (
							<div
								key={item.id}
								onClick={() => handleCardClick(item.link)}
								className="group relative p-4 rounded-2xl border transition-all duration-200 flex items-start gap-4 cursor-pointer bg-card border-border hover:border-primary/40 hover:shadow-sm pr-10"
							>
								{/* Avatar CLB + Badge Icon Phân loại */}
								<div className="relative shrink-0 mt-0.5">
									<img
										src={item.clubLogo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&auto=format&fit=crop&q=80'}
										alt={item.clubName || 'Club'}
										className="w-11 h-11 rounded-full object-cover border border-border"
									/>
									{/* Badge nhỏ đè lên góc dưới avatar */}
									<div
										className={`absolute -bottom-1 -right-1 p-1 rounded-full border border-card ${
											item.type === 'reminder'
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

								{/* Nội dung thông báo */}
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

								{/* Icon Sparkle góc trên bên phải cho bài dưới 3 ngày */}
								{isItemNew && (
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
		</div>
	);
}