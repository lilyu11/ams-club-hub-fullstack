'use client';

import { useState, useEffect, useCallback } from 'react';
import CreatePostCard from '@/components/feed/CreatePostCard';
import PostCard, { PostData } from '@/components/feed/PostCard';
import api from '@/lib/api';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'forYou' | 'following'>('forYou');
  const [posts, setPosts] = useState<PostData[]>([]);
  const [followedClubIds, setFollowedClubIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchFeedPosts = useCallback(async () => {
	setLoading(true);
	try {
	  // Gọi đồng thời API Bài viết, API CLB và API CLB đã follow
	  const [postsRes, clubsRes, followedRes] = await Promise.allSettled([
		api.get('/posts', { params: { limit: 20, sort_by: 'created_at', order: 'desc' } }),
		api.get('/clubs'),
		api.get('/clubs/followed/me'), // API lấy danh sách CLB đã follow
	  ]);

	  // 1. Lấy bài viết
	  let rawPosts: any[] = [];
	  if (postsRes.status === 'fulfilled') {
		rawPosts = Array.isArray(postsRes.value.data) ? postsRes.value.data : postsRes.value.data?.items || [];
	  }

	  // 2. Map tên & logo CLB
	  const clubsMap: Record<number, { name: string; logo?: string }> = {};
	  if (clubsRes.status === 'fulfilled') {
		const rawClubs = Array.isArray(clubsRes.value.data) ? clubsRes.value.data : clubsRes.value.data?.items || [];
		rawClubs.forEach((c: any) => {
		  clubsMap[c.id] = { name: c.name, logo: c.logo_url };
		});
	  }

	  // 3. Lấy danh sách ID các câu lạc bộ đã follow
	  const followedSet = new Set<number>();
	  if (followedRes.status === 'fulfilled') {
		const followedList = Array.isArray(followedRes.value.data) ? followedRes.value.data : followedRes.value.data?.items || [];
		followedList.forEach((club: any) => followedSet.add(club.id || club.club_id));
	  }
	  setFollowedClubIds(followedSet);

	  // 4. Format bài viết
	  const formatted: PostData[] = rawPosts.map((p) => ({
		...p,
		club_name: p.club?.name || clubsMap[p.club_id]?.name || 'AmsClubHub',
		club_logo: p.club?.logo_url || clubsMap[p.club_id]?.logo,
		// Giả lập action_url demo nếu backend chưa trả về field này
		action_url: p.action_url || null, 
	  }));

	  formatted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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

	  {/* Khung Tạo bài viết */}
	  <CreatePostCard onPostCreated={fetchFeedPosts} />

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
		) : posts.length === 0 ? (
		  <div className="text-center py-12 text-muted-foreground text-sm">
			Chưa có bài đăng nào trong Bảng tin.
		  </div>
		) : (
		  <div className="divide-y divide-border">
			{posts.map((post) => (
			  <PostCard
				key={post.id}
				post={post}
				// Tự động truyền true nếu club_id nằm trong danh sách đã follow
				isFollowedInitial={followedClubIds.has(post.club_id)}
			  />
			))}
		  </div>
		)}
	  </div>
	</div>
  );
}