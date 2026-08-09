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
	const [toastMessage, setToastMessage] = useState<string | null>(null);
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	const menuRef = useRef<HTMLDivElement>(null);

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

	const showToast = (message: string) => {
		setToastMessage(message);
		setTimeout(() => {
			setToastMessage(null);
		}, 2500);
	};

	// Toggle Remind me (Theo dõi CLB)
	const handleRemindMe = async (e: React.MouseEvent) => {
		e.stopPropagation(); // Tránh chuyển hướng bài viết
		if (isFollowLoading) return;
		setIsFollowLoading(true);
		const nextState = !isFollowing;
		setIsFollowing(nextState);

		const clubName = post.club_name || 'Câu lạc bộ';

		try {
			await api.post(`/clubs/${post.club_id}/follow`);
			showToast(nextState ? `Đã bật thông báo từ ${clubName}` : `Đã tắt thông báo từ ${clubName}`);
		} catch {
			showToast(nextState ? `Đã bật nhắc nhở từ ${clubName}` : `Đã tắt nhắc nhở từ ${clubName}`);
		} finally {
			setIsFollowLoading(false);
		}
	};

	// Sao chép Link bài viết
	const handleShare = async (e: React.MouseEvent) => {
		e.stopPropagation(); // Tránh chuyển hướng bài viết
		const postUrl = `${window.location.origin}/posts/${post.id}`;

		try {
			if (navigator.clipboard) {
				await navigator.clipboard.writeText(postUrl);
				showToast('Đã sao chép liên kết bài viết!');
			} else {
				// Fallback cho trình duyệt cũ hoặc môi trường không phải HTTPS (không dùng execCommand)
				prompt('Sao chép liên kết bên dưới:', postUrl);
			}
		} catch {
			// Nếu trình duyệt chặn quyền clipboard
			prompt('Sao chép liên kết bên dưới:', postUrl);
		}
	};

	const formatTime = (dateStr: string) => {
		try {
			const diff = Date.now() - new Date(dateStr).getTime();
			const hours = Math.floor(diff / (1000 * 60 * 60));
			if (hours < 1) return 'Vừa xong';
			if (hours < 24) return `${hours} giờ trước`;
			return new Date(dateStr).toLocaleDateString('vi-VN');
		} catch {
			return 'Mới đây';
		}
	};

	return (
		<article className="p-4 border-b border-border hover:bg-muted/20 transition cursor-pointer relative">
			<div className="flex gap-3">
				{/* Logo/Avatar CLB */}
				<Link href={`/clubs/${post.club_id}`} className="shrink-0" onClick={(e) => e.stopPropagation()}>
					{post.club_logo ? (
						<img
							src={getFullImageUrl(post.club_logo)}
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

						{/* Menu Quản lý bài viết (Chỉ hiện khi có quyền canEditClub) */}
						{canEditClub && (
							<div className="relative" ref={menuRef}>
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

								{/* Dropdown Menu Popup */}
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
					<Link href={`/posts/${post.id}`} className="block mt-1 space-y-1">
						<h2 className="text-sm font-bold text-foreground leading-snug">{post.title}</h2>
						{post.content && (
							<p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed whitespace-pre-line">
								{post.content}
							</p>
						)}

						{/* Hình ảnh đính kèm */}
						{post.image_url && (
							<div className="mt-2.5 rounded-2xl overflow-hidden border border-border">
								<img
									src={getFullImageUrl(post.image_url)}
									alt="Post Attachment"
									className="w-full max-h-80 object-cover"
								/>
							</div>
						)}
					</Link>

					{/* Thanh tương tác Bottom */}
					<div className="flex items-center justify-between mt-3 pt-1 text-muted-foreground text-xs">
						{/* Nhóm Nút bên trái: Remind me + Share */}
						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={handleRemindMe}
								disabled={isFollowLoading}
								className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition font-semibold text-xs ${
									isFollowing
										? 'bg-primary/10 text-primary border border-primary/20'
										: 'hover:bg-primary/10 hover:text-primary text-muted-foreground border border-border'
								}`}
							>
								{isFollowing ? (
									<BellRing className="w-3.5 h-3.5 fill-primary text-primary" />
								) : (
									<Bell className="w-3.5 h-3.5" />
								)}
								<span>{isFollowing ? 'Đã bật nhắc nhở' : 'Bật nhắc nhở'}</span>
							</button>

							{/* Nút Chia sẻ (Copy Link) */}
							<button
								type="button"
								onClick={handleShare}
								title="Chia sẻ bài viết"
								className="p-1.5 rounded-full border border-border hover:bg-muted hover:text-foreground text-muted-foreground transition"
							>
								<Share2 className="w-3.5 h-3.5" />
							</button>
						</div>

						{/* Nút "Đăng ký ngay" (Chỉ hiện khi có action_url) */}
						{post.action_url && (
							<a
								href={post.action_url}
								target="_blank"
								rel="noopener noreferrer"
								onClick={(e) => e.stopPropagation()}
								className="flex items-center gap-1.5 bg-primary text-primary-foreground font-bold px-3.5 py-1.5 rounded-full text-xs hover:opacity-90 transition shadow-sm"
							>
								<span>Đăng ký ngay</span>
								<ExternalLink className="w-3.5 h-3.5" />
							</a>
						)}
					</div>
				</div>
			</div>

			{/* Toast thông báo */}
			{toastMessage && (
				<div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 border border-zinc-700 text-white px-4 py-2.5 rounded-full text-sm font-semibold shadow-2xl flex items-center gap-2 transition-all duration-200 animate-in fade-in slide-in-from-top-3">
					<CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
					<span>{toastMessage}</span>
				</div>
			)}
		</article>
	);
}