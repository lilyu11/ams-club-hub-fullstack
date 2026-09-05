'use client';

import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import Link from 'next/link';
import { cachedGet } from '@/lib/requestCache';

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
				const [rawPosts, rawClubs] = await Promise.allSettled([
					cachedGet('/posts', { limit: 10, sort_by: 'created_at', order: 'desc' }),
					cachedGet('/clubs'),
				]);

				let posts: any[] = [];
				if (rawPosts.status === 'fulfilled') {
					posts = Array.isArray(rawPosts.value) ? rawPosts.value : rawPosts.value?.items || [];
				}

				const clubsMap: Record<number, string> = {};
				if (rawClubs.status === 'fulfilled') {
					const clubsData = Array.isArray(rawClubs.value) ? rawClubs.value : rawClubs.value?.items || [];
					clubsData.forEach((club: ClubItem) => {
						clubsMap[club.id] = club.name;
					});
				}

				const mappedPosts: PostItem[] = posts.map((post) => ({
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
							prefetch={false}
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