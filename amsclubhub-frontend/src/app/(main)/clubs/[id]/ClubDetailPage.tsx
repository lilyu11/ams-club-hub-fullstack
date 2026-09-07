'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getFullImageUrl } from '@/lib/utils';
import { UserProfile, Club, PostData } from '@/types/club';

// Import các Component
import ClubHeader from '@/components/club/ClubHeader';
import ClubEditModal from '@/components/club/ClubEditModal';
import PostCard from '@/components/feed/PostCard';
import PostModal from '@/components/post/PostModal';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PlusCircle, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

const DEFAULT_BANNER = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&h=400&auto=format&fit=crop&q=80';
const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&auto=format&fit=crop&q=80';

const sanitizeImageUrl = (url: string | null | undefined, defaultUrl: string) => {
	if (!url || url.trim() === '' || url.includes('via.placeholder.com')) {
		return defaultUrl;
	}
	return getFullImageUrl(url);
};

interface ClubDetailClientProps {
	clubId: string;
}

export default function ClubDetailClient({ clubId }: ClubDetailClientProps) {
	const router = useRouter();

	const [isMounted, setIsMounted] = useState(false);
	const [toastConfig, setToastConfig] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);

	const showToast = (message: string, type: 'success' | 'error' = 'success') => {
		setToastConfig({ message, type });
		setTimeout(() => {
			setToastConfig(null);
		}, 2500);
	};

	const [club, setClub] = useState<Club | null>(null);
	const [posts, setPosts] = useState<PostData[]>([]);
	const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
	const [isFollowing, setIsFollowing] = useState(false);
	const [loading, setLoading] = useState(true);

	const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
	const [postTitle, setPostTitle] = useState('');
	const [postContent, setPostContent] = useState('');
	const [postFormUrl, setPostFormUrl] = useState('');
	const [postImageUrl, setPostImageUrl] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [editingPost, setEditingPost] = useState<PostData | null>(null);
	const [postDeadline, setPostDeadline] = useState('');
	const [postEmailMessage, setPostEmailMessage] = useState('');
	const [postType, setPostType] = useState<'POST' | 'EVENT'>('POST');
	const [eventDuration, setEventDuration] = useState('');

	const [activeTab, setActiveTab] = useState<'POST' | 'EVENT'>('POST');
	const [rawClubData, setRawClubData] = useState<any>(null);

	const [postToDelete, setPostToDelete] = useState<PostData | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	const [isEditClubOpen, setIsEditClubOpen] = useState(false);
	const [clubFormData, setClubFormData] = useState({
		name: '',
		description: '',
		code: '',
		signature: '',
		category: '',
		logo_url: '',
		banner_url: '',
		facebook_url: '',
		contact_email: '',
	});

	const mapRawDataToForm = (data: any) => ({
		name: data?.name || '',
		description: data?.description || '',
		code: data?.code || '',
		signature: data?.signature || '',
		category: data?.category || '',
		logo_url: data?.logo_url || '',
		banner_url: data?.banner_url || data?.banner_urls?.[0] || '',
		facebook_url: data?.facebook_url || '',
		contact_email: data?.contact_email || '',
	});

	useEffect(() => {
		setIsMounted(true);
	}, []);

	useEffect(() => {
		if (!isMounted || !clubId) return;

		const controller = new AbortController();
		const { signal } = controller;

		const initData = async () => {
			const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

			// Chỉ gọi /users/me nếu thực sự có access_token
			const userPromise: Promise<any> = token
				? api.get('/users/me', { signal }).catch(() => null)
				: Promise.resolve(null);

			// Ưu tiên endpoint tổng hợp /detail, fallback sang các request riêng lẻ nếu backend chưa có endpoint này
			let detail: any = await api
				.get(`/clubs/${clubId}/detail`, { signal })
				.then((r) => r.data)
				.catch(() => null);

			if (!detail) {
				const [clubR, postsR, followR] = await Promise.allSettled([
					api.get(`/clubs/${clubId}`, { signal }),
					api.get('/posts', { params: { club_identifier: clubId }, signal }),
					api.get(`/clubs/${clubId}/is-following`, { signal }),
				]);

				detail = {
					club: clubR.status === 'fulfilled' ? clubR.value.data : null,
					posts:
						postsR.status === 'fulfilled'
							? Array.isArray(postsR.value.data)
								? postsR.value.data
								: postsR.value.data?.items || []
							: [],
					is_following:
						followR.status === 'fulfilled' ? !!followR.value.data?.is_following : false,
				};
			}

			const { club: rawClub, posts = [], is_following = false } = detail || {};

			setRawClubData(rawClub);
			setIsFollowing(!!is_following);
			const mappedPosts = Array.isArray(posts) ? posts : posts?.items || [];
			setPosts(mappedPosts.map((p: any) => ({ ...p, club_slug: rawClub?.slug })));

			const rawBanner = rawClub?.banner_url || rawClub?.banner_urls?.[0];
			const logo = sanitizeImageUrl(rawClub?.logo_url, DEFAULT_AVATAR);
			const banner = sanitizeImageUrl(rawBanner, DEFAULT_BANNER);
			const description = rawClub?.description || 'Câu lạc bộ này chưa có mô tả.';

			setClub({
				...rawClub,
				logo_url: logo,
				banner_url: banner,
				description,
			});
			setClubFormData(mapRawDataToForm(rawClub));

			const userData = await userPromise;
			if (userData) {
				setCurrentUser(userData.data);
			}

			if (!signal.aborted) {
				setLoading(false);
			}
		};

		initData().catch((err) => {
			if (err?.code !== 'ERR_CANCELED') {
				console.error('Lỗi tải dữ liệu CLB:', err);
			}
			if (!signal.aborted) {
				setLoading(false);
			}
		});

		// Hủy các request khi người dùng rời trang nhanh
		return () => controller.abort();
	}, [clubId, router, isMounted]);

	if (!isMounted || loading) {
		return (
			<div className="flex h-[60vh] flex-col items-center justify-center gap-2 text-slate-500">
				<Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
				<p className="text-sm font-medium">Đang tải thông tin câu lạc bộ...</p>
			</div>
		);
	}

	if (!club) {
		return (
			<div className="flex h-[60vh] items-center justify-center text-slate-500">
				Không tìm thấy thông tin câu lạc bộ này.
			</div>
		);
	}

	const userRole = currentUser?.role?.toLowerCase();
	const isSuperAdmin = userRole === 'super_admin';
	const isClubAdmin = userRole === 'club_admin';

	const isCurrentClubAdmin =
		isClubAdmin &&
		Boolean(currentUser?.id && club?.admin_id && String(currentUser.id) === String(club.admin_id));

	// Dùng để chỉnh sửa modal bài viết và profile
	const canEditClub = isSuperAdmin || isCurrentClubAdmin;
	// Dùng để chặn không cho follow câu lạc bộ
	const isAdminRole = isSuperAdmin || isClubAdmin;

	const handleToggleFollow = async () => {
		if (typeof window === 'undefined') return;
		const token = localStorage.getItem('access_token');
		if (!token) {
			showToast('Vui lòng đăng nhập để bật thông báo!', 'error');
			return;
		}

		const prevStatus = isFollowing;
		setIsFollowing(!prevStatus);
		try {
			await api.post(`/clubs/${clubId}/follow`);
		} catch (err) {
			setIsFollowing(prevStatus);
		}
	};

	const handleSaveClubProfile = async (e: React.SyntheticEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!club) return;

		try {
			const payload = {
				name: clubFormData.name?.trim() || '',
				category: clubFormData.category?.trim() || '',
				code: clubFormData.code?.trim() || '',
				signature: clubFormData.signature?.trim() || '',
				description: clubFormData.description?.trim() || '',
				logo_url: clubFormData.logo_url?.trim() || '',
				banner_url: clubFormData.banner_url?.trim() || '',
				facebook_url: clubFormData.facebook_url?.trim() || '',
				contact_email: clubFormData.contact_email?.trim() || '',
			};

			const response = await api.put(`/clubs/${club.id}`, payload);
			if (response.status === 200 || response.status === 201) {
				showToast('Cập nhật thông tin CLB thành công!', 'success');

				let rawUpdated = response.data;
				try {
					const refreshedRes = await api.get(`/clubs/${club.id}`);
					if (refreshedRes.data) rawUpdated = refreshedRes.data;
				} catch (e) {
					console.log('Sử dụng dữ liệu phản hồi trực tiếp từ API PUT');
				}

				setRawClubData(rawUpdated);

				const rawBanner = rawUpdated.banner_url || rawUpdated.banner_urls?.[0] || payload.banner_url;
				const rawLogo = rawUpdated.logo_url || payload.logo_url;

				const logo = sanitizeImageUrl(rawLogo, DEFAULT_AVATAR);
				const banner = sanitizeImageUrl(rawBanner, DEFAULT_BANNER);
				const description = rawUpdated.description || payload.description;

				const updatedClub = {
					...rawUpdated,
					name: rawUpdated.name || payload.name,
					category: rawUpdated.category || payload.category,
					logo_url: logo,
					banner_url: banner,
					description: description,
					facebook_url: rawUpdated.facebook_url || payload.facebook_url,
					contact_email: rawUpdated.contact_email || payload.contact_email,
				};

				setClub(updatedClub);
				setClubFormData(mapRawDataToForm(rawUpdated));
				setIsEditClubOpen(false);
			}
		} catch (err: any) {
			console.error('Lỗi khi cập nhật CLB:', err);
			showToast(`Cập nhật thất bại: ${err?.response?.data?.detail || err.message || 'Lỗi kết nối'}`, 'error');
		}
	};

	const handleOpenEditModal = (post: PostData) => {
		setEditingPost(post);
		setPostTitle(post.title || '');
		setPostFormUrl(post.action_url || (post as any).form_url || '');
		setPostImageUrl(post.image_url || '');

		if (post.deadline) {
			try {
				const d = new Date(post.deadline);
				const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
					.toISOString()
					.slice(0, 16);
				setPostDeadline(localIso);
			} catch {
				setPostDeadline('');
			}
		} else {
			setPostDeadline('');
		}

		const isEvent = post.type === 'EVENT';
		setPostType(isEvent ? 'EVENT' : 'POST');

		if (isEvent && post.content?.startsWith('Thời gian hoạt động:')) {
			const lines = post.content.split('\n\n');
			const durationText = lines[0].replace('Thời gian hoạt động:', '').trim();
			setEventDuration(durationText);
			setPostContent(lines.slice(1).join('\n\n'));
		} else {
			setEventDuration('');
			setPostContent(post.content || '');
			setPostEmailMessage(post.email_message || '');
		}

		setIsPostDialogOpen(true);
	};

	const handleCreateOrUpdatePost = async (e: React.SyntheticEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!postTitle.trim() || !postContent.trim()) return;

		setSubmitting(true);
		try {
			const finalContent = postType === 'EVENT' && eventDuration
				? `Thời gian hoạt động: ${eventDuration}\n\n${postContent}`
				: postContent;

			const payload = {
				type: postType,
				title: postTitle,
				content: finalContent,
				image_url: postImageUrl.trim() || null,
				action_url: postFormUrl.trim() || null,
				deadline: postDeadline ? new Date(postDeadline).toISOString() : null,
				email_message: postEmailMessage.trim() || null,
			};

			setIsPostDialogOpen(false);

			if (editingPost) {
				const res = await api.put(`/posts/${editingPost.id}`, payload);
				setPosts((prev) => prev.map((p) => (p.id === editingPost.id ? res.data : p)));
				showToast('Cập nhật bài viết thành công!', 'success');
			} else {
				await api.post(`/clubs/${clubId}/posts`, payload);
				const postsRes = await api.get('/posts', { params: { club_identifier: clubId } });
				setPosts(Array.isArray(postsRes.data) ? postsRes.data : postsRes.data?.items || []);
				showToast('Đăng bài thành công!', 'success');
			}

			setPostTitle('');
			setPostContent('');
			setPostFormUrl('');
			setPostImageUrl('');
			setPostDeadline('');
			setPostEmailMessage('');
			setPostType('POST');
			setEventDuration('');
			setEditingPost(null);
		} catch (err) {
			showToast('Có lỗi xảy ra khi lưu bài đăng.', 'error');
		} finally {
			setSubmitting(false);
		}
	};

	const handleRequestDelete = (post: PostData) => {
		setPostToDelete(post);
	};

	const confirmDeletePost = async () => {
		if (!postToDelete) return;
		setIsDeleting(true);

		try {
			await api.delete(`/posts/${postToDelete.id}`);
			setPosts((prev) => prev.filter((p) => p.id !== postToDelete.id));
			showToast('Đã xóa bài viết thành công!', 'success');
		} catch (err) {
			console.error(err);
			showToast('Không thể xóa bài viết. Vui lòng thử lại!', 'error');
		} finally {
			setIsDeleting(false);
			setPostToDelete(null);
		}
	};

	const filteredPosts = posts.filter((post) => {
		if (activeTab === 'EVENT') {
			return post.type === 'EVENT';
		}
		return post.type === 'POST' || !post.type;
	});

	return (
		<div className="w-full max-w-5xl mx-auto space-y-6 p-4 sm:p-6 pb-12">
			<ClubHeader
				club={club}
				isFollowing={isFollowing}
				canEditClub={canEditClub}
				isAdminRole={isAdminRole}
				onToggleFollow={handleToggleFollow}
				onOpenEditClubModal={() => {
					const dataToUse = rawClubData || club;
					if (dataToUse) {
						setClubFormData(mapRawDataToForm(dataToUse));
					}
					setIsEditClubOpen(true);
				}}
			/>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<div className="md:col-span-3 space-y-4">
					<div className="flex items-center justify-between">
						<div>
							<div className="flex items-center gap-1 bg-muted p-1 rounded-2xl border border-border">
								<button
									type="button"
									onClick={() => setActiveTab('POST')}
									className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all duration-200 ${activeTab === 'POST'
										? 'bg-card text-foreground shadow-sm'
										: 'text-muted-foreground hover:text-foreground'
										}`}
								>
									Bài viết ({posts.filter((p) => p.type === 'POST' || !p.type).length})
								</button>
								<button
									type="button"
									onClick={() => setActiveTab('EVENT')}
									className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all duration-200 ${activeTab === 'EVENT'
										? 'bg-card text-foreground shadow-sm'
										: 'text-muted-foreground hover:text-foreground'
										}`}
								>
									Sự kiện ({posts.filter((p) => p.type === 'EVENT').length})
								</button>
							</div>
						</div>

						{canEditClub && (
							<Button
								size="sm"
								className="bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl px-4 py-2 transition-all duration-200 shadow-sm"
								onClick={() => {
									setEditingPost(null);
									setPostTitle('');
									setPostContent('');
									setPostFormUrl('');
									setPostImageUrl('');
									setPostDeadline('');
									setPostEmailMessage('');
									setPostType(activeTab);
									setEventDuration('');
									setIsPostDialogOpen(true);
								}}
							>
								<PlusCircle className="mr-1.5 h-3.5 w-3.5" />
								{activeTab === 'EVENT' ? 'Thêm sự kiện' : 'Thêm bài viết'}
							</Button>
						)}
					</div>

					{filteredPosts.length === 0 ? (
						<Card className="p-8 text-center text-muted-foreground bg-card border border-border rounded-2xl shadow-sm">
							{activeTab === 'EVENT'
								? 'Câu lạc bộ này hiện chưa có sự kiện nào.'
								: 'Câu lạc bộ này hiện chưa có bài viết nào.'}
						</Card>
					) : (
						<div className="space-y-4">
							{filteredPosts.map((post) => {
								const formattedPost: PostData = {
									...post,
									club_id: post.club_id || club?.id,
									club_name: post.club_name || club?.name || 'Câu lạc bộ',
									club_logo: post.club_logo || club?.logo_url || DEFAULT_AVATAR,
									action_url: post.action_url || (post as any).form_url || undefined,
									deadline: post.deadline || undefined,
								};

								return (
									<PostCard
										key={post.id}
										post={formattedPost}
										isFollowedInitial={isFollowing}
										canEditClub={canEditClub}
										onEdit={handleOpenEditModal}
										onDelete={handleRequestDelete}
									/>
								);
							})}
						</div>
					)}
				</div>
			</div>

			{canEditClub && (
				<ClubEditModal
					isOpen={isEditClubOpen}
					onClose={() => setIsEditClubOpen(false)}
					formData={clubFormData}
					setFormData={setClubFormData}
					onSubmit={handleSaveClubProfile}
					showToast={showToast}
				/>
			)}

			<PostModal
				isOpen={isPostDialogOpen}
				onClose={() => setIsPostDialogOpen(false)}
				editingPost={editingPost}
				postTitle={postTitle}
				setPostTitle={setPostTitle}
				postContent={postContent}
				setPostContent={setPostContent}
				postFormUrl={postFormUrl}
				setPostFormUrl={setPostFormUrl}
				postImageUrl={postImageUrl}
				setPostImageUrl={setPostImageUrl}
				postDeadline={postDeadline}
				setPostDeadline={setPostDeadline}
				postEmailMessage={postEmailMessage}
				setPostEmailMessage={setPostEmailMessage}
				postType={postType}
				setPostType={setPostType}
				eventDuration={eventDuration}
				setEventDuration={setEventDuration}
				submitting={submitting}
				onSubmit={handleCreateOrUpdatePost}
				showToast={showToast}
			/>

			{postToDelete && (
				<div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
					<div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
						<div className="space-y-1.5">
							<h3 className="text-lg font-bold text-foreground">
								Xác nhận xóa bài viết?
							</h3>
							<p className="text-sm text-muted-foreground">
								Hành động này không thể hoàn tác. Bài viết &quot;<span className="font-semibold text-foreground">{postToDelete.title}</span>&quot; sẽ bị xóa vĩnh viễn khỏi hệ thống.
							</p>
						</div>

						<div className="flex items-center justify-end gap-3 pt-2">
							<button
								type="button"
								disabled={isDeleting}
								onClick={() => setPostToDelete(null)}
								className="px-4 py-2 text-sm font-semibold rounded-xl text-foreground bg-muted hover:bg-muted/80 transition disabled:opacity-50"
							>
								Hủy bỏ
							</button>
							<button
								type="button"
								disabled={isDeleting}
								onClick={confirmDeletePost}
								className="px-4 py-2 text-sm font-semibold rounded-xl text-white bg-red-600 hover:bg-red-700 transition flex items-center gap-2 disabled:opacity-50"
							>
								{isDeleting ? 'Đang xóa...' : 'Xóa bài viết'}
							</button>
						</div>
					</div>
				</div>
			)}

			{toastConfig && (
				<div
					className={`fixed top-6 left-1/2 -translate-x-1/2 z-[9999] px-4 py-2.5 rounded-full text-sm font-semibold shadow-2xl flex items-center gap-2 border transition-all duration-200 animate-in fade-in slide-in-from-top-3 ${toastConfig.type === 'error'
						? 'bg-card border-border text-foreground'
						: 'bg-card border-border text-foreground'
						}`}
				>
					{toastConfig.type === 'error' ? (
						<AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
					) : (
						<CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
					)}
					<span>{toastConfig.message}</span>
				</div>
			)}
		</div>
	);
}