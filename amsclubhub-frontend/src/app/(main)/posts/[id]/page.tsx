'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
	ArrowLeft,
	Bell,
	BellRing,
	Share2,
	ExternalLink,
	Shield,
	CheckCircle2,
	Sparkles,
} from 'lucide-react';
import api from '@/lib/api';
import { getFullImageUrl } from '@/lib/utils';

interface PostDetail {
	id: number | string;
	title: string;
	content?: string;
	image_url?: string;
	created_at?: string;
	action_url?: string;
	deadline?:string;
	club_id?: number | string;
	is_following?: boolean;
	club_name?: string;
	club_logo?: string;
	club?: {
		id: number | string;
		name: string;
		logo_url?: string;
	};
}

export default function PostDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const resolvedParams = use(params);
	const postId = resolvedParams.id;
	const router = useRouter();

	const [post, setPost] = useState<PostDetail | null>(null);
	const [clubInfo, setClubInfo] = useState<{ name?: string; logo?: string } | null>(null);
	const [loading, setLoading] = useState(true);
	const [isFollowing, setIsFollowing] = useState(false);
	const [isFollowLoading, setIsFollowLoading] = useState(false);
	const [toastMessage, setToastMessage] = useState<string | null>(null);

	useEffect(() => {
		const fetchPostDetail = async () => {
			setLoading(true);
			try {
				// 1. Tải thông tin bài viết
				const response = await api.get(`/posts/${postId}`);
				const postData: PostDetail = response.data?.data || response.data;
				setPost(postData);

				const clubId = postData.club_id || postData.club?.id;

				// 2. Nếu có club_id, tự động lấy thông tin CLB & Trạng thái Follow của User
				if (clubId) {
					const [clubRes, followedRes] = await Promise.allSettled([
						api.get(`/clubs/${clubId}`),
						api.get('/clubs/followed/me'),
					]);

					// Tải Tên & Logo CLB đầy đủ
					if (clubRes.status === 'fulfilled') {
						const cData = clubRes.value.data?.data || clubRes.value.data;
						setClubInfo({
							name: cData.name,
							logo: cData.logo_url || cData.banner_url,
						});
					}

					// Tải chính xác trạng thái đã Bật nhắc nhở / Follow chưa
					if (followedRes.status === 'fulfilled') {
						const followedList = Array.isArray(followedRes.value.data)
							? followedRes.value.data
							: followedRes.value.data?.items || followedRes.value.data?.data || [];

						const isFollowed = followedList.some(
							(c: any) => String(c.id || c.club_id) === String(clubId)
						);
						setIsFollowing(isFollowed);
					} else if (postData.is_following !== undefined) {
						setIsFollowing(!!postData.is_following);
					}
				}
			} catch (error) {
				console.error('Lỗi khi tải chi tiết bài viết:', error);
				setPost(null);
			} finally {
				setLoading(false);
			}
		};

		if (postId) {
			fetchPostDetail();
		}
	}, [postId]);

	const showToast = (message: string) => {
		setToastMessage(message);
		setTimeout(() => {
			setToastMessage(null);
		}, 2500);
	};

	const formatTime = (dateStr?: string) => {
		if (!dateStr) return 'Mới đây';
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

	const handleRemindMe = async () => {
		const clubId = post?.club_id || post?.club?.id;
		if (isFollowLoading || !clubId) return;
		setIsFollowLoading(true);
		const nextState = !isFollowing;
		setIsFollowing(nextState);

		const clubName = clubInfo?.name || post?.club_name || post?.club?.name || 'Câu lạc bộ';

		try {
			await api.post(`/clubs/${clubId}/follow`);
			showToast(
				nextState
					? `Đã bật thông báo từ ${clubName}`
					: `Đã tắt thông báo từ ${clubName}`
			);
		} catch {
			showToast(
				nextState
					? `Đã bật nhắc nhở từ ${clubName}`
					: `Đã tắt nhắc nhở từ ${clubName}`
			);
		} finally {
			setIsFollowLoading(false);
		}
	};

	const handleShare = async () => {
		const postUrl = typeof window !== 'undefined' ? window.location.href : '';

		try {
			if (navigator.clipboard) {
				await navigator.clipboard.writeText(postUrl);
				showToast('Đã sao chép liên kết bài viết!');
			} else {
				prompt('Sao chép liên kết bên dưới:', postUrl);
			}
		} catch {
			prompt('Sao chép liên kết bên dưới:', postUrl);
		}
	};

	if (loading) {
		return (
			<div className="max-w-2xl mx-auto space-y-4 min-h-screen">
				<div className="px-4 py-3 border-b border-border flex items-center gap-3">
					<div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
				</div>
				<div className="p-4 space-y-3 animate-pulse">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-full bg-muted" />
						<div className="space-y-1.5">
							<div className="h-4 w-28 bg-muted rounded" />
							<div className="h-3 w-16 bg-muted rounded" />
						</div>
					</div>
					<div className="h-5 w-3/4 bg-muted rounded" />
					<div className="w-full h-64 bg-muted rounded-2xl" />
				</div>
			</div>
		);
	}

	if (!post) {
		return (
			<div className="max-w-2xl mx-auto min-h-screen text-center py-20 px-4">
				<Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
				<h2 className="text-base font-bold text-foreground">
					Không tìm thấy bài viết
				</h2>
				<p className="text-xs text-muted-foreground mt-1 mb-5">
					Bài viết có thể đã bị xóa hoặc đường dẫn không tồn tại.
				</p>
				<button
					type="button"
					onClick={() => router.back()}
					className="px-4 py-2 bg-primary text-primary-foreground rounded-full text-xs font-bold hover:opacity-90 transition"
				>
					Trở về trang trước
				</button>
			</div>
		);
	}

	const clubId = post.club_id || post.club?.id;
	const clubLogo = clubInfo?.logo || post.club_logo || post.club?.logo_url;
	const clubName = clubInfo?.name || post.club_name || post.club?.name || `Câu lạc bộ #${clubId}`;

	return (
		<div className="max-w-2xl mx-auto min-h-screen pb-20 relative">
			{/* Header Mũi tên tròn quay lại */}
			<div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md px-4 py-2.5 border-b border-border flex items-center gap-4">
				<button
					type="button"
					onClick={() => router.back()}
					className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted text-foreground transition shrink-0"
					title="Quay lại"
				>
					<ArrowLeft className="w-5 h-5" />
				</button>
				<h2 className="font-bold text-base text-foreground truncate">
					Bài viết
				</h2>
			</div>

			<article className="p-4 sm:p-6 space-y-4">
				{/* Header CLB */}
				<div className="flex items-center gap-3">
					<Link href={`/clubs/${clubId}`} className="shrink-0">
						{clubLogo ? (
							<img
								src={getFullImageUrl(clubLogo)}
								alt={clubName}
								className="w-10 h-10 rounded-full object-cover border border-border hover:opacity-90 transition"
							/>
						) : (
							<div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
								<Shield className="w-5 h-5" />
							</div>
						)}
					</Link>

					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-1.5 flex-wrap text-xs">
							<Link
								href={`/clubs/${clubId}`}
								className="font-bold text-foreground hover:underline truncate"
							>
								{clubName}
							</Link>
							<span className="text-muted-foreground">•</span>
							<span className="text-muted-foreground">
								{formatTime(post.created_at)}
							</span>
						</div>
					</div>
				</div>

				{/* Tiêu đề & Nội dung */}
				<div className="space-y-2">
					<h1 className="text-base sm:text-lg font-bold text-foreground leading-snug">
						{post.title}
					</h1>

					{post.content && (
						<p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
							{post.content}
						</p>
					)}

					{/* Hình ảnh đính kèm */}
					{post.image_url && (
						<div className="mt-3 rounded-2xl overflow-hidden border border-border">
							<img
								src={getFullImageUrl(post.image_url)}
								alt="Post Attachment"
								className="w-full max-h-[550px] object-cover"
							/>
						</div>
					)}
				</div>

				{/* Thanh tương tác Bottom */}
				<div className="flex items-center justify-between pt-3 border-t border-border text-muted-foreground text-xs">
					<div className="flex items-center gap-2">
						{/* Nút Nhắc nhở */}
						<button
							type="button"
							onClick={handleRemindMe}
							disabled={isFollowLoading}
							className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition font-semibold text-xs ${
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

						{/* Nút Chia sẻ */}
						<button
							type="button"
							onClick={handleShare}
							title="Chia sẻ bài viết"
							className="p-1.5 rounded-full border border-border hover:bg-muted hover:text-foreground text-muted-foreground transition"
						>
							<Share2 className="w-3.5 h-3.5" />
						</button>
					</div>

					{/* Nút Đăng ký ngay */}
					{post.action_url && (
						<a
							href={post.action_url}
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-1.5 bg-primary text-primary-foreground font-bold px-3.5 py-1.5 rounded-full text-xs hover:opacity-90 transition shadow-sm"
						>
							<span>Đăng ký ngay</span>
							<ExternalLink className="w-3.5 h-3.5" />
						</a>
					)}
				</div>
			</article>

			{/* Toast thông báo nổi */}
			{toastMessage && (
				<div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 border border-zinc-700 text-white px-4 py-2.5 rounded-full text-sm font-semibold shadow-2xl flex items-center gap-2 transition-all duration-200 animate-in fade-in slide-in-from-top-3">
					<CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
					<span>{toastMessage}</span>
				</div>
			)}
		</div>
	);
}