'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getFullImageUrl } from '@/lib/utils';
import Link from 'next/link';

export default function ClubsPage() {
	const [clubs, setClubs] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		api.get('/clubs')
			.then((res) => setClubs(res.data))
			.catch((err) => console.error('Lỗi lấy danh sách CLB:', err))
			.finally(() => setLoading(false));
	}, []);

	if (loading) {
		return <div className="p-8 text-center text-sm font-medium">Đang tải danh sách câu lạc bộ...</div>;
	}

	return (
		<div className="max-w-5xl mx-auto p-6 space-y-6">
			<h1 className="text-2xl font-bold text-slate-800">Danh sách Câu lạc bộ</h1>
			
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				{clubs.map((club) => (
					<Link
						key={club.id}
						href={`/clubs/${club.id}`}
						className="border rounded-xl p-4 hover:shadow-md transition-all bg-white flex items-center gap-3 group"
					>
						<img
							src={getFullImageUrl(club.logo_url)}
							alt={club.name}
							className="w-12 h-12 rounded-full object-cover bg-slate-100 border"
						/>
						<div>
							<h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
								{club.name}
							</h3>
							<p className="text-xs text-slate-500">{club.category || 'Chưa phân loại'}</p>
						</div>
					</Link>
				))}
			</div>
		</div>
	);
}