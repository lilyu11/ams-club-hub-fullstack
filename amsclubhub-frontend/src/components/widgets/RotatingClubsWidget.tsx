'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Users, Shield } from 'lucide-react';
import Link from 'next/link';
import { cachedGet } from '@/lib/requestCache';
import { getFullImageUrl } from '@/lib/utils';

interface ClubItem {
	id: number;
	name: string;
	category?: string;
	logo_url?: string;
	avatar_url?: string;
}

export default function RotatingClubsWidget() {
	const [allClubs, setAllClubs] = useState<ClubItem[]>([]);
	const [displayClubs, setDisplayClubs] = useState<ClubItem[]>([]);
	const [loading, setLoading] = useState(true);

	const rotateClubs = useCallback((clubsList: ClubItem[]) => {
		if (clubsList.length === 0) return;
		const shuffled = [...clubsList].sort(() => 0.5 - Math.random());
		setDisplayClubs(shuffled.slice(0, 3));
	}, []);

	useEffect(() => {
		const fetchClubs = async () => {
			try {
				const data = await cachedGet('/clubs');
				const clubs = Array.isArray(data) ? data : data?.items || [];
				setAllClubs(clubs);
				rotateClubs(clubs);
			} catch (err) {
				console.error('Lỗi lấy danh sách CLB:', err);
			} finally {
				setLoading(false);
			}
		};

		fetchClubs();
	}, [rotateClubs]);

	useEffect(() => {
		if (allClubs.length === 0) return;
		const interval = setInterval(() => {
			rotateClubs(allClubs);
		}, 5 * 60 * 1000);

		return () => clearInterval(interval);
	}, [allClubs, rotateClubs]);

	return (
		<div className="p-4 border border-border rounded-2xl bg-card space-y-3">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Users className="w-4 h-4 text-primary" />
					<h3 className="font-bold text-sm text-card-foreground">Gợi ý câu lạc bộ</h3>
				</div>
				<button
					onClick={() => rotateClubs(allClubs)}
					title="Đổi danh sách"
					className="text-muted-foreground hover:text-foreground transition"
				>
					<RefreshCw className="w-3.5 h-3.5" />
				</button>
			</div>

			{loading ? (
				<div className="space-y-2">
					{Array.from({ length: 3 }).map((_, i) => (
						<div key={i} className="h-10 bg-muted/50 rounded-xl animate-pulse"></div>
					))}
				</div>
			) : displayClubs.length === 0 ? (
				<p className="text-xs text-muted-foreground py-2">Chưa có câu lạc bộ nào.</p>
			) : (
				<div className="space-y-2.5">
					{displayClubs.map((club) => {
						const avatar = club.logo_url || club.avatar_url;

						return (
							<div key={club.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-muted/50 transition gap-2">
								<div className="flex items-center gap-2.5 min-w-0">
									{/* Avatar CLB bên trái */}
									{avatar ? (
										<img
											src={getFullImageUrl(avatar)}
											alt={club.name}
											className="w-9 h-9 rounded-full object-cover shrink-0 border border-border"
										/>
									) : (
										<div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
											<Shield className="w-4 h-4" />
										</div>
									)}

									<div className="flex flex-col truncate">
										<p className="text-sm font-semibold text-card-foreground">
											{club.name}
										</p>
										<span className="text-xs text-muted-foreground truncate">
											{club.category || 'Chưa phân loại'}
										</span>
									</div>
								</div>

								<Link
									href={`/clubs/${club.id}`}
									prefetch={false}
									className="text-xs bg-primary text-primary-foreground font-semibold px-3 py-1.5 rounded-full hover:opacity-90 transition shrink-0 inline-flex items-center justify-center"
								>
									Xem thêm
								</Link>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}