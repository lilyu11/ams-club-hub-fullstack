'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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

// Ảnh mặc định an toàn
const DEFAULT_BANNER = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&h=400&auto=format&fit=crop&q=80';
const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&auto=format&fit=crop&q=80';

// Hàm xử lý URL ảnh
const sanitizeImageUrl = (url: string | null | undefined, defaultUrl: string) => {
	if (!url || url.trim() === '' || url.includes('via.placeholder.com')) {
		return defaultUrl;
	}
	return getFullImageUrl(url);
};

export default function ClubDetailPage() {
	// Quản lý State Toast ở File Cha
	const [toastConfig, setToastConfig] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);

	const showToast = (message: string, type: 'success' | 'error' = 'success') => {
		setToastConfig({ message, type });
		setTimeout(() => {
			setToastConfig(null);
		}, 2500);
	};

	const params = useParams();
	const router = useRouter();
	const clubId = params?.id as string;

	// States Dữ liệu
	const [club, setClub] = useState<Club | null>(null);
	const [posts, setPosts] = useState<PostData[]>([]);
	const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
	const [isFollowing, setIsFollowing] = useState(false);
	const [loading, setLoading] = useState(true);

	// States Modal Bài đăng
	const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
	const [postTitle, setPostTitle] = useState('');
	const [postContent, setPostContent] = useState('');
	const [postFormUrl, setPostFormUrl] = useState('');
	const [postImageUrl, setPostImageUrl] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [editingPost, setEditingPost] = useState<PostData | null>(null);
	const [postDeadline, setPostDeadline] = useState('');
	const [postType, setPostType] = useState<'POST' | 'EVENT'>('POST');
	const [eventDuration, setEventDuration] = useState('');

	// State chọn tab hiển thị bài đăng hoặc sự kiện
	const [activeTab, setActiveTab] = useState<'POST' | 'EVENT'>('POST');

	// State lưu dữ liệu thô từ API cho Form Sửa CLB
	const [rawClubData, setRawClubData] = useState<any>(null);

	// State quản lý bài viết đang chờ xác nhận xóa
	const [postToDelete, setPostToDelete] = useState<PostData | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	// States Modal Sửa CLB
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

	// Hàm map dữ liệu thô sang Form
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
		if (!clubId) return;
		const initData = async () => {
			try {

				const token = localStorage.getItem('access_token');
				if (token) {
					// Tải thông tin người dùng hiện tại
					try {
						const userRes = await api.get('/users/me');
						setCurrentUser(userRes.data);
					} catch (e) {
						console.log('Chưa kết nối API /users/me.');
					}
				}

				// Tải thông tin CLB
				const clubRes = await api.get(`/clubs/${clubId}`);
				const rawClub = clubRes.data;

				setRawClubData(rawClub);

				const rawBanner = rawClub.banner_url || rawClub.banner_urls?.[0];
				const logo = sanitizeImageUrl(rawClub.logo_url, DEFAULT_AVATAR);
				const banner = sanitizeImageUrl(rawBanner, DEFAULT_BANNER);
				const description = rawClub.description || 'Câu lạc bộ này chưa có mô tả.';

				const processedClub = {
					...rawClub,
					logo_url: logo,
					banner_url: banner,
					description: description,
				};

				setClub(processedClub);
				setClubFormData(mapRawDataToForm(rawClub));

				// Tải danh sách bài đăng
				try {
					const postsRes = await api.get('/posts', {
						params: { club_identifier: clubId },
					});
					setPosts(Array.isArray(postsRes.data) ? postsRes.data : postsRes.data?.items || []);
				} catch (e) {
					console.log('Chưa có bài đăng nào.');
				}

				// Tải trạng thái Follow
				try {
					const followRes = await api.get(`/clubs/${clubId}/is-following`);
					setIsFollowing(!!followRes.data?.is_following);
				} catch (e) {
					console.log('Chưa có endpoint follow.');
				}
			} catch (err) {
				console.error('Lỗi tải dữ liệu CLB:', err);
			} finally {
				setLoading(false);
			}
		};

		initData();
	}, [clubId, router]);

	// Phân quyền
	const userRole = currentUser?.role?.toLowerCase();
	const isSuperAdmin = userRole === 'super_admin';

	// So sánh ID current user với admin_id của CLB
	const isCurrentClubAdmin =
		userRole === 'club_admin' &&
		Boolean(currentUser?.id && club?.admin_id && String(currentUser.id) === String(club.admin_id));

	const canEditClub = isSuperAdmin || isCurrentClubAdmin;

	// Toggle Follow (Bật thông báo)
	const handleToggleFollow = async () => {
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

	// Cập nhật thông tin CLB
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

	// Khi bấm nút "Sửa bài viết/sự kiện"
	const handleOpenEditModal = (post: PostData) => {
		setEditingPost(post);
		setPostTitle(post.title || '');
		setPostFormUrl(post.action_url || (post as any).form_url || '');
		setPostImageUrl(post.image_url || '');

		// Format ISO string sang định dạng YYYY-MM-DDTHH:mm cho datetime-local input
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

		// Xác định type
		const isEvent = post.type === 'EVENT';
		setPostType(isEvent ? 'EVENT' : 'POST');

		// Nếu là event, bóc tách thời gian từ content (nếu có)
		if (isEvent && post.content?.startsWith('Thời gian hoạt động:')) {
			const lines = post.content.split('\n\n');
			const durationText = lines[0].replace('Thời gian hoạt động:', '').trim();
			setEventDuration(durationText);
			setPostContent(lines.slice(1).join('\n\n')); // Lấy phần content còn lại
		} else {
			setEventDuration('');
			setPostContent(post.content || '');
		}

		setIsPostDialogOpen(true);
	};

	// Đăng bài hoặc cập nhật bài đăng
	const handleCreateOrUpdatePost = async (e: React.SyntheticEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!postTitle.trim() || !postContent.trim()) return;

		setSubmitting(true);
		try {
			// Ghép eventDuration vào content nếu là EVENT
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
			setPostType('POST');
			setEventDuration('');
			setEditingPost(null);
		} catch (err) {
			showToast('Có lỗi xảy ra khi lưu bài đăng.', 'error');
		} finally {
			setSubmitting(false);
		}
	};

	// Xóa Bài đăng
	// Hàm được gọi khi user bấm nút "Xóa" trên PostCard
	const handleRequestDelete = (post: PostData) => {
		setPostToDelete(post); // Mở Modal xác nhận
	};

	// Hàm xóa thật sự khi user bấm "Đồng ý xóa" trên Modal
	const confirmDeletePost = async () => {
		if (!postToDelete) return;
		setIsDeleting(true);

		try {
			await api.delete(`/posts/${postToDelete.id}`);

			// Cập nhật lại danh sách bài viết trên UI
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

	if (loading) {
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

	// Lọc danh sách bài đăng / sự kiện dựa trên activeTab
	const filteredPosts = posts.filter((post) => {
		if (activeTab === 'EVENT') {
			return post.type === 'EVENT';
		}
		// Mặc định tab 'POST' sẽ hiển thị các bài viết dạng POST hoặc không có type
		return post.type === 'POST' || !post.type;
	});

	return (
		<div className="w-full max-w-5xl mx-auto space-y-6 p-4 sm:p-6 pb-12">
			{/* Header CLB */}
			<ClubHeader
				club={club}
				isFollowing={isFollowing}
				canEditClub={canEditClub}
				onToggleFollow={handleToggleFollow}
				onOpenEditClubModal={() => {
					const dataToUse = rawClubData || club;
					if (dataToUse) {
						setClubFormData(mapRawDataToForm(dataToUse));
					}
					setIsEditClubOpen(true);
				}}
			/>

			{/* Khu vực chính: Bài đăng */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<div className="md:col-span-3 space-y-4">
					<div className="flex items-center justify-between">
						{/* Thanh Tab Chuyển Đổi (Bài viết / Sự kiện) */}
						<div>
							{/* Cụm Tab dạng Capsule bo tròn tự động đổi màu theo Theme */}
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

						{/* Modal đăng bài*/}
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

			{/* Modal sửa profile CLB */}
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

			{/* Modal đăng/Sửa bài viết */}
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
				postType={postType}
				setPostType={setPostType}
				eventDuration={eventDuration}
				setEventDuration={setEventDuration}
				submitting={submitting}
				onSubmit={handleCreateOrUpdatePost}
				showToast={showToast}
			/>

			{/* Modal Xác nhận xóa bài viết */}
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

			{/* Toast thông báo */}
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