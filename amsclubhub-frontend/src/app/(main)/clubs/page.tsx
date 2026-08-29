'use client';
export const runtime = 'edge';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Users, Sparkles, Compass } from 'lucide-react';
import api from '@/lib/api';
import { Club } from '@/types/club';
import { getFullImageUrl } from '@/lib/utils';

const CATEGORIES = ['Tất cả', 'Thể thao', 'Nghệ thuật', 'Học thuật', 'Xã hội'];

// Hàm kiểm tra chuỗi URL hợp lệ
const isValidUrlStr = (url?: string | null): boolean => {
	if (!url || typeof url !== 'string') return false;
	const trimmed = url.trim().toLowerCase();
	return trimmed !== '' && trimmed !== 'string' && trimmed !== 'null';
};

// Component thẻ CLB
function ClubCard({ club }: { club: Club }) {
	const [imgError, setImgError] = useState(false);

	const validRawUrl = isValidUrlStr(club.logo_url)
		? club.logo_url
		: isValidUrlStr(club.banner_url)
			? club.banner_url
			: null;

	const imageUrl = validRawUrl ? getFullImageUrl(validRawUrl) : null;

	return (
		<Link
			href={`/clubs/${club.id}/`}
			className="group relative bg-white dark:bg-zinc-900/70 hover:bg-slate-50 dark:hover:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-800/80 hover:border-slate-300 dark:hover:border-zinc-700/80 rounded-2xl p-3.5 transition-all duration-200 flex flex-col shadow-sm hover:shadow-md"
		>
			<div className="relative w-full aspect-square rounded-xl overflow-hidden bg-zinc-800 mb-3 flex items-center justify-center">
				{imageUrl && !imgError ? (
					<Image
						src={imageUrl}
						alt={club.name || 'Club'}
						fill
						unoptimized
						className="object-cover group-hover:scale-105 transition-transform duration-300"
						onError={() => setImgError(true)}
					/>
				) : (
					<div className="flex items-center gap-1.5 min-w-0 mb-3">
						{/* Fallback khi lỗi ảnh */}
						<div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-sky-500/20 flex items-center justify-center text-blue-400 font-bold text-xl">
							{club.code || club.name?.substring(0, 2).toUpperCase() || 'CLUB'}
						</div>
					</div>
				)}

				{club.category && (
					<span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-semibold bg-black/60 backdrop-blur-md text-white rounded-md z-10">
						{club.category}
					</span>
				)}
			</div>

			<div className="flex-1 flex flex-col justify-between">
				<div>

					<h3 className="font-bold text-sm text-slate-900 dark:text-zinc-100 line-clamp-1 group-hover:text-blue-500 transition-colors">
						{club.name}
					</h3>

					<div className="flex items-center gap-1.5 min-w-0 mt-1">
						<span className="shrink min-w-0 truncate text-[10px] font-medium px-1.5 py-0.5 bg-slate-100 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700/60 rounded-md">
							#{club.code}
						</span>
						{club.signature && (
							<span
								className="shrink-0 inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded-md max-w-[95px] truncate"
								title={typeof club.signature === 'string' ? club.signature : 'Signature'}
							>
								★ {typeof club.signature === 'string' ? club.signature : 'Signature'}
							</span>
						)}
					</div>
				</div>

				<div className="flex items-center gap-1 mt-3 pt-2 border-t border-slate-100 dark:border-zinc-800/50 text-[11px] text-slate-500 dark:text-zinc-400">
					<Users className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
					<span>{club.followers_count || 0} người theo dõi</span>
				</div>
			</div>
		</Link>
	);
}

export default function ClubsPage() {
	const [clubs, setClubs] = useState<Club[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedCategory, setSelectedCategory] = useState('Tất cả');
	const [viewScope, setViewScope] = useState<'all' | 'followed'>('all');

	useEffect(() => {
		const fetchClubs = async () => {
			setLoading(true);
			try {
				const endpoint = viewScope === 'followed' ? '/clubs/followed/me' : '/clubs';
				const response = await api.get(endpoint, {
					params: { limit: 100 }, // Lấy tối đa 100 CLB
				});

				const rawData = response.data?.data || response.data?.items || response.data || [];
				const clubsList = Array.isArray(rawData) ? rawData : rawData.data || [];

				setClubs(clubsList);
			} catch (error) {
				console.error('Lỗi khi tải danh sách CLB:', error);
				setClubs([]);
			} finally {
				setLoading(false);
			}
		};

		fetchClubs();
	}, [viewScope]);

	const filteredClubs = useMemo(() => {
		return clubs.filter((club) => {
			const query = searchQuery.toLowerCase().trim();
			const matchesSearch =
				!query ||
				club.name?.toLowerCase().includes(query) ||
				club.code?.toLowerCase().includes(query) ||
				club.signature?.toLowerCase().includes(query) ||
				club.description?.toLowerCase().includes(query);

			const matchesCategory =
				selectedCategory === 'Tất cả' || club.category === selectedCategory;

			return matchesSearch && matchesCategory;
		});
	}, [clubs, searchQuery, selectedCategory]);

	return (
		<div className="p-4 sm:p-6 space-y-6 min-h-screen pb-20">
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Compass className="w-7 h-7 text-blue-500" />
						<h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-100">
							Câu lạc bộ
						</h1>
					</div>
				</div>

				<div className="relative">
					<Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-zinc-500" />
					<input
						type="text"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Tìm kiếm theo tên, mã viết tắt..."
						className="w-full pl-11 pr-4 py-3 bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/60 rounded-2xl text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
					/>
				</div>
			</div>

			<div className="flex flex-wrap items-center gap-2 pt-1 border-b border-slate-200/60 dark:border-zinc-800/80 pb-4">
				<div className="flex items-center bg-slate-100 dark:bg-zinc-800/80 p-1 rounded-xl mr-2">
					<button
						type="button"
						onClick={() => setViewScope('all')}
						className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${viewScope === 'all'
							? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-zinc-100 shadow-sm'
							: 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
							}`}
					>
						Tất cả
					</button>
					<button
						type="button"
						onClick={() => setViewScope('followed')}
						className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${viewScope === 'followed'
							? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-zinc-100 shadow-sm'
							: 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
							}`}
					>
						Đã theo dõi
					</button>
				</div>

				<div className="h-5 w-[1px] bg-slate-200 dark:bg-zinc-800 my-auto mr-1 hidden sm:block" />

				{CATEGORIES.map((cat) => (
					<button
						key={cat}
						type="button"
						onClick={() => setSelectedCategory(cat)}
						className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${selectedCategory === cat
							? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
							: 'bg-slate-100 dark:bg-zinc-800/60 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-200'
							}`}
					>
						{cat}
					</button>
				))}
			</div>

			{loading ? (
				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
					{Array.from({ length: 10 }).map((_, i) => (
						<div
							key={i}
							className="bg-slate-100 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 space-y-3 animate-pulse"
						>
							<div className="w-full aspect-square bg-slate-200 dark:bg-zinc-800 rounded-xl" />
							<div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-3/4" />
							<div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-1/2" />
						</div>
					))}
				</div>
			) : filteredClubs.length === 0 ? (
				<div className="text-center py-16 bg-slate-50 dark:bg-zinc-900/40 border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl">
					<Sparkles className="w-10 h-10 text-slate-400 dark:text-zinc-600 mx-auto mb-3" />
					<h3 className="text-base font-semibold text-slate-800 dark:text-zinc-200">
						Không tìm thấy câu lạc bộ nào
					</h3>
					<p className="text-xs text-slate-500 dark:text-zinc-500 mt-1">
						Thử thay đổi từ khóa tìm kiếm hoặc chọn danh mục khác.
					</p>
				</div>
			) : (
				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
					{filteredClubs.map((club) => (
						<ClubCard key={club.id} club={club} />
					))}
				</div>
			)}
		</div>
	);
}