'use client';

import { useState, useEffect, useCallback } from 'react';
import PostCard from '@/components/feed/PostCard';
import api from '@/lib/api';
import { PostData } from '@/types/club';

export default function HomePage() {
	const [activeTab, setActiveTab] = useState<'forYou' | 'following'>('forYou');
	const [posts, setPosts] = useState<PostData[]>([]);
	const [followedClubIds, setFollowedClubIds] = useState<Set<number | string | undefined>>(new Set());
	const [loading, setLoading] = useState(true);

	const fetchFeedPosts = useCallback(async () => {
		setLoading(true);
		try {
			// Tính mốc thời gian 7 ngày trước
			const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
			const sevenDaysAgo = Date.now() - SEVEN_DAYS_MS;

			// Gọi đồng thời API Bài viết, API CLB và API CLB đã follow
			const [postsRes, clubsRes, followedRes] = await Promise.allSettled([
			api.get('/posts', { params: { limit: 200, sort_by: 'created_at', order: 'desc', type: 'POST' } }),
			api.get('/clubs', { params: { limit: 100 } }),
			api.get('/clubs/followed/me'),
			]);

			// Lấy danh sách bài viết từ Response
			let rawPosts: any[] = [];
			if (postsRes.status === 'fulfilled') {
			rawPosts = Array.isArray(postsRes.value.data)
				? postsRes.value.data
				: postsRes.value.data?.items || postsRes.value.data?.data || [];
			}

			// Lọc các bài viết được tạo trong vòng 7 ngày gần nhất
			const recentPosts = rawPosts.filter((post) => {			
				// Lấy bài viết thuộc type POST hoặc không có type
				const isPostType = post.type === "POST" || !post.type;
				if (!isPostType) return false;
				// Giữ lại nếu bài viết không có trường ngày
				if (!post.created_at) return true; 
				const postTime = new Date(post.created_at).getTime();
				return postTime >= sevenDaysAgo;
			});

			// Map tên & logo CLB
			const clubsMap: Record<number, { name: string; logo?: string }> = {};
			if (clubsRes.status === 'fulfilled') {
			const rawClubs = Array.isArray(clubsRes.value.data)
				? clubsRes.value.data
				: clubsRes.value.data?.items || clubsRes.value.data?.data || [];
			rawClubs.forEach((c: any) => {
				clubsMap[c.id] = { name: c.name, logo: c.logo_url };
			});
			}

			// Lấy danh sách ID các câu lạc bộ đã follow
			const followedSet = new Set<number>();
			if (followedRes.status === 'fulfilled') {
			const followedList = Array.isArray(followedRes.value.data)
				? followedRes.value.data
				: followedRes.value.data?.items || followedRes.value.data?.data || [];
			followedList.forEach((club: any) => followedSet.add(club.id || club.club_id));
			}
			setFollowedClubIds(followedSet);

			// Format bài viết (Chỉ format danh sách recentPosts đã được lọc 7 ngày)
			const formatted: PostData[] = recentPosts.map((p) => ({
			...p,
			club_name: p.club?.name || clubsMap[p.club_id]?.name || 'AmsClubHub',
			club_logo: p.club?.logo_url || clubsMap[p.club_id]?.logo,
			action_url: p.action_url || null,
			}));

			// Sắp xếp bài viết mới nhất lên đầu
			formatted.sort((a, b) => {
			const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
			const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
			return timeB - timeA;
			});

			setPosts(formatted);
		} catch (err) {
			console.error('Lỗi khi tải bảng tin:', err);
		} finally {
			setLoading(false);
		}
		}, []);

	useEffect(() => {
	fetchFeedPosts();
	}, [fetchFeedPosts]);

	// Lọc bài viết hiển thị theo Tab đang chọn
	const displayedPosts =
	activeTab === 'following'
		? posts.filter((p) => followedClubIds.has(p.club_id))
		: posts;

	return (
	<div className="min-h-screen">
		{/* Header Tabs */}
		<div className="sticky top-0 z-10 backdrop-blur-md bg-background/80 border-b border-border flex">
		<button
			onClick={() => setActiveTab('forYou')}
			className="flex-1 py-3 text-sm font-bold text-center relative hover:bg-muted/40 transition"
		>
			<span className={activeTab === 'forYou' ? 'text-foreground' : 'text-muted-foreground'}>
			Dành cho bạn
			</span>
			{activeTab === 'forYou' && (
			<div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-primary rounded-full" />
			)}
		</button>

		<button
			onClick={() => setActiveTab('following')}
			className="flex-1 py-3 text-sm font-bold text-center relative hover:bg-muted/40 transition"
		>
			<span className={activeTab === 'following' ? 'text-foreground' : 'text-muted-foreground'}>
			Đang theo dõi
			</span>
			{activeTab === 'following' && (
			<div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-1 bg-primary rounded-full" />
			)}
		</button>
		</div>

		{/* Khung Tạo bài viết UNDONE*/}
		{/* <CreatePostCard onPostCreated={fetchFeedPosts} /> */}

		{/* Bảng tin */}
		<div>
		{loading ? (
			<div className="divide-y divide-border">
			{Array.from({ length: 4 }).map((_, i) => (
				<div key={i} className="p-4 space-y-3 animate-pulse">
				<div className="flex gap-3">
					<div className="w-10 h-10 rounded-full bg-muted shrink-0"></div>
					<div className="flex-1 space-y-2">
					<div className="h-3 bg-muted rounded w-1/3"></div>
					<div className="h-4 bg-muted rounded w-3/4"></div>
					</div>
				</div>
				</div>
			))}
			</div>
		) : displayedPosts.length === 0 ? (
			<div className="text-center py-12 text-muted-foreground text-sm">
			{activeTab === 'following'
				? 'Bạn chưa theo dõi câu lạc bộ nào hoặc các câu lạc bộ chưa có bài đăng.'
				: 'Chưa có bài đăng nào trong Bảng tin.'}
			</div>
		) : (
			<div className="divide-y divide-border">
			{displayedPosts.map((post) => (
				<PostCard
				key={post.id}
				post={post}
				isFollowedInitial={followedClubIds.has(post.club_id)}
				canEditClub={false} // Trang chủ không cho sửa/xóa bài
				/>
			))}
			</div>
		)}
		</div>
	</div>
	);
}