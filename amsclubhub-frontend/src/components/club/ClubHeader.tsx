import Link from 'next/link';
import { ArrowLeft, Settings, Bell, BellRing, CheckCircle2 } from 'lucide-react';
import { getFullImageUrl } from '@/lib/utils';

interface ClubHeaderProps {
	club: any;
	isFollowing?: boolean;
	canEditClub?: boolean;
	onToggleFollow?: () => void;
	onOpenEditClubModal?: () => void;
}

export default function ClubHeader({
	club,
	isFollowing = false,
	canEditClub = false,
	onToggleFollow,
	onOpenEditClubModal,
}: ClubHeaderProps) {
	return (
		<div className="w-full space-y-3 font-sans text-zinc-900 dark:text-white">
			{/* TOP BAR / NÚT QUAY VỀ TRANG CHỦ */}
			<div className="flex items-center gap-4 py-1 px-1">
				<Link
					href="/"
					prefetch={false}
					className="p-2 rounded-full bg-white dark:bg-neutral-900/80 text-zinc-800 dark:text-white hover:bg-zinc-100 dark:hover:bg-neutral-800 transition-all border border-zinc-200 dark:border-neutral-800 shadow-sm"
					title="Quay về trang chủ"
				>
					<ArrowLeft className="w-5 h-5" />
				</Link>
				<div>
					<h2 className="text-base font-bold text-zinc-900 dark:text-white leading-tight flex items-center gap-1.5">
						{club?.name || 'Câu lạc bộ'}
						<CheckCircle2 className="w-4 h-4 text-sky-500 fill-sky-500/20 inline" />
					</h2>
					<p className="text-xs text-zinc-500 dark:text-neutral-400">
						{club?.followers_count || 0} người theo dõi
					</p>
				</div>
			</div>

			{/* KHU VỰC HEADER (BANNER + LOGO + THÔNG TIN) */}
			<div className="w-full bg-white dark:bg-black rounded-3xl border border-zinc-200 dark:border-neutral-800 shadow-lg dark:shadow-2xl overflow-hidden transition-colors">
				{/* Banner */}
				<div className="relative w-full aspect-[3/1] sm:aspect-[16/5] bg-zinc-100 dark:bg-neutral-900 overflow-hidden">
					<img
						src={getFullImageUrl(club?.banner_url) || '/static/images/default-banner.png'}
						alt="Banner CLB"
						className="w-full h-full object-cover object-center"
						onError={(e) => {
							(e.target as HTMLImageElement).src = 'https://placehold.co/1200x400/18181b/fff?text=Banner';
						}}
					/>
				</div>

				{/* Thông tin chính bên dưới Banner */}
				<div className="px-5 sm:px-6 pb-6 relative">
					<div className="flex flex-row items-end justify-between gap-4 -mt-12 sm:-mt-16 mb-4">

						{/* Logo tròn viền khớp màu nền */}
						<div className="relative h-24 w-24 sm:h-32 sm:w-32 rounded-full border-4 border-white dark:border-black bg-white dark:bg-black shadow-xl overflow-hidden shrink-0">
							<img
								src={getFullImageUrl(club?.logo_url) || '/static/images/default-logo.png'}
								alt={club?.name}
								className="h-full w-full object-cover"
								onError={(e) => {
									(e.target as HTMLImageElement).src = 'https://placehold.co/300x300/18181b/fff?text=Logo';
								}}
							/>
						</div>

						{/* CÁC NÚT THAO TÁC */}
						<div className="flex items-center gap-1.5 sm:gap-2 mb-1 shrink-0 max-w-full">
							{/* Nút Remind Me / Follow */}
							{(onToggleFollow && !canEditClub) && (
								<button
									onClick={onToggleFollow}
									className={`flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm font-bold rounded-full transition-all active:scale-95 whitespace-nowrap shrink-0 ${isFollowing
										? 'bg-zinc-100 dark:bg-neutral-900 text-zinc-800 dark:text-white border border-zinc-300 dark:border-neutral-700 hover:bg-zinc-200 dark:hover:bg-neutral-800'
										: 'bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-neutral-200'
										}`}
								>
									{isFollowing ? (
										<>
											<BellRing className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-500 dark:text-sky-400 fill-sky-500/20 shrink-0" />
											<span>
												Đã bật<span className="hidden sm:inline"> thông báo</span>
											</span>
										</>
									) : (
										<>
											<Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
											<span>Thông báo</span>
										</>
									)}
								</button>
							)}

							{/* Nút Chỉnh sửa CLB */}
							{canEditClub && (
								<button
									onClick={onOpenEditClubModal}
									className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-zinc-800 dark:text-white bg-zinc-100 dark:bg-black hover:bg-zinc-200 dark:hover:bg-neutral-900 rounded-full border border-zinc-300 dark:border-neutral-700 transition-all active:scale-95 whitespace-nowrap shrink-0"
								>
									<Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-500 dark:text-neutral-400 shrink-0" />
									<span>Chỉnh sửa</span>
								</button>
							)}
						</div>
					</div>

					{/* Tên & Mã CLB */}
					<div className="space-y-1">
						<div className="flex items-center gap-2 flex-wrap">
							<h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight flex items-center gap-1.5">
								{club?.name}
								<CheckCircle2 className="w-5 h-5 text-sky-500 fill-sky-500/20" />
							</h1>
						</div>

						<div className="flex items-center gap-2 text-xs">
							<span className="px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-neutral-900 text-zinc-700 dark:text-neutral-300 border border-zinc-200 dark:border-neutral-800 uppercase font-medium">
								#{club?.code ? club.code : 'CLUB'}
							</span>
							<span className="px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-neutral-900 text-zinc-700 dark:text-neutral-300 border border-zinc-200 dark:border-neutral-800 font-medium">
								{club?.category || 'Chưa phân loại'}
							</span>
							<span className="px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-neutral-900 text-zinc-700 dark:text-neutral-300 border border-zinc-200 dark:border-neutral-800 font-medium">
								{club?.signature || 'Đặc trưng câu lạc bộ'}
							</span>
						</div>
					</div>

					{/* Mô tả câu lạc bộ */}
					{club?.description && (
						<p className="text-sm text-zinc-600 dark:text-neutral-200 mt-3 leading-relaxed whitespace-pre-line">
							{club.description}
						</p>
					)}

					{/* Stats người theo dõi & Contact */}
					<div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-4 pt-3 border-t border-zinc-200 dark:border-neutral-800/80 text-xs sm:text-sm text-zinc-500 dark:text-neutral-400">
						{/* Số lượng người theo dõi */}
						<div className="whitespace-nowrap shrink-0">
							<strong className="text-zinc-900 dark:text-white font-bold">{club?.followers_count || 0}</strong>{' '}
							<span>người theo dõi</span>
						</div>

						{/* Email liên hệ */}
						{club?.contact_email && (
							<div className="flex items-center gap-1.5 min-w-0 max-w-full">
								<span className="hidden sm:inline text-zinc-300 dark:text-neutral-600">•</span>
								<span className="text-zinc-500 dark:text-neutral-400 truncate">{club.contact_email}</span>
							</div>
						)}
					</div>

				</div>
			</div>
		</div>
	);
}