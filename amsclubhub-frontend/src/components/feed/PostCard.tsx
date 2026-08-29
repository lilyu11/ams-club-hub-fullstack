'use client';

import { PostData } from '@/types/club';
import { useState, useEffect, useRef } from 'react';
import {
	Bell,
	BellRing,
	ExternalLink,
	Shield,
	MoreHorizontal,
	CheckCircle2,
	Share2,
	Edit3,
	Trash2,
	AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { getFullImageUrl } from '@/lib/utils';

interface PostCardProps {
	post: PostData;
	isFollowedInitial?: boolean; // Nhận từ danh sách club đã follow
	canEditClub?: boolean; // Quyền chỉnh sửa/xóa bài viết
	onEdit?: (post: PostData) => void;
	onDelete?: (post: PostData) => void;
}

export default function PostCard({
	post,
	isFollowedInitial = false,
	canEditClub = false,
	onEdit,
	onDelete,
}: PostCardProps) {
	// Ưu tiên lấy trạng thái follow từ prop truyền vào
	const [isFollowing, setIsFollowing] = useState(isFollowedInitial || !!post.is_following);
	const [isFollowLoading, setIsFollowLoading] = useState(false);
	const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isReminded, setIsReminded] = useState<boolean>(false);
	const [isLoadingReminder, setIsLoadingReminder] = useState<boolean>(false);

	const menuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const checkReminderStatus = async () => {
			const token = localStorage.getItem('access_token');
			if (!token) return; // EDITINGRN show toast hiện bạn chưa đăng nhập

			try {
				const response = await api.get('/reminders/me');
				const reminders = response.data || [];

				// Kiểm tra xem bài viết này đã có trong danh sách reminder chưa
				const exists = reminders.some(
					(item: any) =>
						String(item.campaign_post_id) === String(post.id) ||
						String(item.campaign_post?.id) === String(post.id)
				);

				if (exists) {
					setIsReminded(true);
				}
			} catch (error) {
				console.error('Lỗi kiểm tra danh sách reminder:', error);
			}
		};

		checkReminderStatus();
	}, [post.id]);

	// Cập nhật lại state khi prop thay đổi
	useEffect(() => {
		setIsFollowing(isFollowedInitial || !!post.is_following);
	}, [isFollowedInitial, post.is_following]);

	// Click bên ngoài để tự đóng Dropdown Menu
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setIsMenuOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const showToast = (message: string, type: 'success' | 'error' = 'success') => {
		setToastMessage({ message, type });
		setTimeout(() => {
			setToastMessage(null);
		}, 2500);
	};

	// Nút thông báo
	const handleRemindMe = async (e: React.MouseEvent) => {
		e.stopPropagation(); // Tránh chuyển hướng bài viết

		// Kiểm tra Token
		const token = localStorage.getItem('access_token');
		if (!token) {
			showToast('Vui lòng đăng nhập để bật thông báo', 'error');
			return;
		}

		if (!post.deadline) {
			showToast('Bài viết không có deadline để nhắc nhở', 'error');
			return;
		}

		// Kiểm tra deadline có hợp lệ và đã trôi qua so với hiện tại chưa
		const deadlineDate = new Date(post.deadline);
		const now = new Date();
		if (isNaN(deadlineDate.getTime()) || deadlineDate < now) {
			showToast('Đã quá hạn deadline, không thể bật nhắc nhở!', 'error');
			return;
		}

		// Nếu đang loading hoặc đã bật thông báo rồi thì dừng (khóa 1 chiều)
		if (isLoadingReminder || isReminded) return;

		setIsLoadingReminder(true);

		try {
			await api.post(`/posts/${post.id}/remind`);
			setIsReminded(true);
			showToast('Đã bật nhắc nhở cho bài viết này!', 'success');
		} catch (error) {
			console.error('Lỗi khi cài đặt nhắc nhở:', error);
			showToast('Không thể bật nhắc nhở. Vui lòng thử lại sau.', 'error');
		} finally {
			setIsLoadingReminder(false);
		}
	};

	// Sao chép Link bài viết
	const handleShare = async (e: React.MouseEvent) => {
		e.stopPropagation(); // Tránh chuyển hướng bài viết
		const postUrl = `${window.location.origin}/posts/${post.id}`;

		try {
			if (navigator.clipboard) {
				await navigator.clipboard.writeText(postUrl);
				showToast('Đã sao chép liên kết bài viết!', 'success');
			} else {
				// Fallback cho trình duyệt cũ hoặc môi trường không phải HTTPS (không dùng execCommand)
				prompt('Sao chép liên kết bên dưới:', postUrl);
			}
		} catch {
			// Nếu trình duyệt chặn quyền clipboard
			prompt('Sao chép liên kết bên dưới:', postUrl);
		}
	};

	const formatTime = (dateStr?: string) => {
		if (!dateStr) return 'Mới đây';

		try {
			// Chuẩn hóa chuỗi thời gian (thay khoảng trắng bằng 'T')
			let formattedStr = dateStr.replace(' ', 'T');

			// Nếu thiếu 'Z' hoặc múi giờ, ép về UTC bằng cách thêm 'Z'
			if (!formattedStr.endsWith('Z') && !formattedStr.includes('+')) {
				formattedStr += 'Z';
			}

			const pastTime = new Date(formattedStr).getTime();
			const now = Date.now();
			const diffInSeconds = Math.floor((now - pastTime) / 1000);

			// Dưới 1 phút
			if (diffInSeconds < 60) return 'Vừa xong';

			// Hiển thị theo phút
			const minutes = Math.floor(diffInSeconds / 60);
			if (minutes < 60) return `${minutes} phút trước`;

			// Hiển thị theo giờ
			const hours = Math.floor(minutes / 60);
			if (hours < 24) return `${hours} giờ trước`;

			// Trên 24 tiếng -> Trả về ngày tháng (theo đúng múi giờ VN)
			return new Date(formattedStr).toLocaleDateString('vi-VN');
		} catch {
			return 'Mới đây';
		}
	};

	return (
		<article className="p-4 border-b border-border hover:bg-muted/20 transition cursor-pointer relative">
			<div className="flex gap-3">
				{/* Logo/Avatar CLB */}
				<Link href={`/clubs/${post.club_id}`}
					className="shrink-0"
					onClick={(e) => e.stopPropagation()}>
					{post.club_logo ? (
						<img
							src={post.club_logo}
							alt={post.club_name || 'Club'}
							className="w-10 h-10 rounded-full object-cover border border-border hover:opacity-90 transition"
						/>
					) : (
						<div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
							<Shield className="w-5 h-5" />
						</div>
					)}
				</Link>

				{/* Nội dung chính bài viết */}
				<div className="flex-1 min-w-0">
					{/* Header Bài viết */}
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-1.5 flex-wrap text-xs">
							<Link
								href={`/clubs/${post.club_id}`}
								className="font-bold text-foreground hover:underline truncate"
								onClick={(e) => e.stopPropagation()}
							>
								{post.club_name || `Câu lạc bộ #${post.club_id}`}
							</Link>
							<span className="text-muted-foreground">•</span>
							<span className="text-muted-foreground">{formatTime(post.created_at)}</span>
						</div>

						{/* Menu Quản lý bài viết */}
						{canEditClub && (
							<div className="relative">
								<button
									type="button"
									onClick={(e) => {
										e.stopPropagation();
										setIsMenuOpen((prev) => !prev);
									}}
									className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted transition"
								>
									<MoreHorizontal className="w-4 h-4" />
								</button>

								{isMenuOpen && (
									<div className="absolute right-0 mt-1 w-36 bg-popover border border-border rounded-xl shadow-xl z-20 overflow-hidden py-1">
										{onEdit && (
											<button
												type="button"
												onClick={(e) => {
													e.stopPropagation();
													setIsMenuOpen(false);
													onEdit(post);
												}}
												className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition text-left"
											>
												<Edit3 className="w-3.5 h-3.5 text-amber-500" />
												<span>Chỉnh sửa</span>
											</button>
										)}
										{onDelete && (
											<button
												type="button"
												onClick={(e) => {
													e.stopPropagation();
													setIsMenuOpen(false);
													onDelete(post);
												}}
												className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-destructive hover:bg-muted transition text-left"
											>
												<Trash2 className="w-3.5 h-3.5" />
												<span>Xóa bài</span>
											</button>
										)}
									</div>
								)}
							</div>
						)}
					</div>

					{/* Tiêu đề & Nội dung */}
					<Link href={`/posts/${post.id}`}
						className="block mt-1 space-y-1">
						<h2 className="text-sm font-bold text-foreground leading-snug">{post.title}</h2>
						{post.content && (
							<p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed whitespace-pre-line">
								{post.content}
							</p>
						)}

						{post.image_url && (
							<div className="mt-2.5 rounded-2xl overflow-hidden border border-border flex items-center justify-center bg-muted/30">
								<img
									src={post.image_url}
									alt="Post Attachment"
									className="w-full h-auto max-h-[500px] object-cover"
								/>
							</div>
						)}
					</Link>

					{/* Thanh tương tác Bottom */}
					<div className="flex items-center justify-between mt-3 pt-1 text-muted-foreground text-xs gap-2">
						<div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
							{/* Nút Bật nhắc nhở */}
							<button
								type="button"
								onClick={handleRemindMe}
								disabled={isLoadingReminder || isReminded}
								className={`flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full transition font-medium sm:font-semibold text-[11px] sm:text-xs whitespace-nowrap shrink-0 ${isReminded
									? 'bg-primary/10 text-primary border border-primary/20 opacity-90 cursor-not-allowed'
									: 'hover:bg-primary/10 hover:text-primary text-muted-foreground border border-border'
									}`}
							>
								{isReminded ? (
									<BellRing className="w-3.5 h-3.5 fill-primary text-primary shrink-0" />
								) : (
									<Bell className="w-3.5 h-3.5 shrink-0" />
								)}
								<span>{isReminded ? 'Đã bật nhắc nhở' : 'Bật nhắc nhở'}</span>
							</button>

							{/* Nút Chia sẻ */}
							<button
								type="button"
								onClick={handleShare}
								title="Chia sẻ bài viết"
								className="p-1 sm:p-1.5 rounded-full border border-border hover:bg-muted hover:text-foreground text-muted-foreground transition shrink-0"
							>
								<Share2 className="w-3.5 h-3.5" />
							</button>
						</div>

						{post.action_url && (
							<a
								href={post.action_url}
								target="_blank"
								rel="noopener noreferrer"
								onClick={(e) => e.stopPropagation()}
								className="flex items-center gap-1 sm:gap-1.5 bg-primary text-primary-foreground font-semibold sm:font-bold px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-[11px] sm:text-xs hover:opacity-90 transition shadow-sm whitespace-nowrap shrink-0"
							>
								<span>Đăng ký ngay</span>
								<ExternalLink className="w-3.5 h-3.5 shrink-0" />
							</a>
						)}
					</div>
				</div>
			</div>

			{/* Toast thông báo */}
			{toastMessage && (
				<div
					className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full text-sm font-semibold shadow-2xl flex items-center gap-2 transition-all duration-200 animate-in fade-in slide-in-from-top-3 ${toastMessage.type === 'error'
						? 'bg-zinc-900 border border-zine-700 text-white'
						: 'bg-zinc-900 border border-zinc-700 text-white'
						}`}
				>
					{toastMessage.type === 'error' ? (
						<AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
					) : (
						<CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
					)}
					<span>{toastMessage.message}</span>
				</div>
			)}
		</article>
	);
}