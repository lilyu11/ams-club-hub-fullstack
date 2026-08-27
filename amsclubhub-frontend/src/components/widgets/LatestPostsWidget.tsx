'use client';

import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

interface PostItem {
	id: number;
	title: string;
	club_id: number;
	club_name?: string;
	created_at: string;
}

interface ClubItem {
	id: number;
	name: string;
}

export default function LatestPostsWidget() {
	const [posts, setPosts] = useState<PostItem[]>([]);
	const [loading, setLoading] = useState(true);

	const isNew = (dateString: string) => {
		if (!dateString) return false;
		const diffInMs = new Date().getTime() - new Date(dateString).getTime();
		const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
		return diffInDays >= 0 && diffInDays < 7;
	};

	useEffect(() => {
		const fetchLatestPostsAndClubs = async () => {
			try {
				const [postsRes, clubsRes] = await Promise.allSettled([
					api.get('/posts', { params: { limit: 10, sort_by: 'created_at', order: 'desc' } }),
					api.get('/clubs'),
				]);

				let rawPosts: any[] = [];
				if (postsRes.status === 'fulfilled') {
					rawPosts = Array.isArray(postsRes.value.data) ? postsRes.value.data : postsRes.value.data?.items || [];
				}

				const clubsMap: Record<number, string> = {};
				if (clubsRes.status === 'fulfilled') {
					const rawClubs = Array.isArray(clubsRes.value.data) ? clubsRes.value.data : clubsRes.value.data?.items || [];
					rawClubs.forEach((club: ClubItem) => {
						clubsMap[club.id] = club.name;
					});
				}

				const mappedPosts: PostItem[] = rawPosts.map((post) => ({
					...post,
					club_name: post.club?.name || post.club_name || clubsMap[post.club_id] || 'AmsClubHub',
				}));

				const recentPosts = mappedPosts
					.filter((post) => isNew(post.created_at))
					.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

				setPosts(recentPosts.slice(0, 3));
			} catch (err) {
				console.error('Lỗi lấy bài viết mới:', err);
			} finally {
				setLoading(false);
			}
		};

		fetchLatestPostsAndClubs();
	}, []);

	return (
		<div className="p-4 border border-border rounded-2xl bg-card space-y-3">
			<div className="flex items-center gap-2">
				<Sparkles className="w-4 h-4 text-primary" />
				<h3 className="font-bold text-sm text-card-foreground">Bài đăng mới nhất</h3>
			</div>

			{loading ? (
				<div className="space-y-2">
					{Array.from({ length: 3 }).map((_, i) => (
						<div key={i} className="h-10 bg-muted/50 rounded-xl animate-pulse"></div>
					))}
				</div>
			) : posts.length === 0 ? (
				<p className="text-xs text-muted-foreground py-2">Chưa có bài đăng nào mới.</p>
			) : (
				<div className="space-y-2">
					{posts.map((post) => (
						<Link
							key={post.id}
							href={`/posts/${post.id}`}
							className="block p-2.5 rounded-xl bg-muted/40 hover:bg-muted/80 transition border border-border/40 hover:border-border"
						>
							<p className="text-[11px] font-semibold text-primary/90">
								{post.club_name}
							</p>
							<p className="text-sm font-semibold text-card-foreground line-clamp-1 mt-0.5">
								{post.title}
							</p>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}