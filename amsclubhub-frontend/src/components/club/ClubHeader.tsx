import Link from 'next/link';
import { ArrowLeft, Settings, UserPlus, UserCheck } from 'lucide-react';

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
		<div className="w-full space-y-3">
			{/* 1. NÚT QUAY VỀ TRANG CHỦ */}
			<div className="flex items-center justify-between">
				<Link
					href="/"
					className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200/80 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 shadow-sm transition-all"
				>
					<ArrowLeft className="w-4 h-4" />
					<span>Quay về trang chủ</span>
				</Link>
			</div>

			{/* 2. KHU VỰC HEADER (BANNER + LOGO + THÔNG TIN) */}
			<div className="w-full bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
				{/* Banner chuẩn tỉ lệ */}
				<div className="relative w-full aspect-[16/5] bg-gradient-to-r from-slate-100 to-slate-200 overflow-hidden">
					<img
						src={club?.banner_url || '/static/images/default-banner.png'}
						alt="Banner CLB"
						className="w-full h-full object-cover object-center"
						onError={(e) => {
							(e.target as HTMLImageElement).src = 'https://placehold.co/1200x400?text=Unavailable';
						}}
					/>
				</div>

				{/* Thông tin chính bên dưới Banner */}
				<div className="px-6 pb-5 relative">
					<div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-14 mb-4">
						
						{/* Logo + Tên câu lạc bộ */}
						<div className="flex items-end gap-4">
							<div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-full border-4 border-white bg-white shadow-md overflow-hidden shrink-0">
								<img
									src={club?.logo_url || '/static/images/default-logo.png'}
									alt={club?.name}
									className="h-full w-full object-cover"
									onError={(e) => {
										(e.target as HTMLImageElement).src = 'https://placehold.co/300x300?text=Unavailable';
									}}
								/>
							</div>

							<div className="pb-1">
								<div className="flex items-center gap-2 flex-wrap">
									<h1 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight">
										{club?.name}
									</h1>
									{club?.code && (
										<span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 uppercase">
											#{club.code}
										</span>
									)}
								</div>

								<div className="flex items-center gap-2 mt-1">
									<span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100">
										{club?.category || 'Thể thao'}
									</span>
									<span className="text-xs text-slate-400">
										• {club?.followers_count || 0} người theo dõi
									</span>
								</div>
							</div>
						</div>

						{/* CÁC NÚT THAO TÁC (CHỈNH SỬA HOẶC THEO DÕI) */}
						<div className="flex items-center gap-2 sm:mb-1">
							{/* Nút Theo dõi / Đang theo dõi (Dành cho thành viên) */}
							{onToggleFollow && (
								<button
									onClick={onToggleFollow}
									className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all active:scale-95 ${
										isFollowing
											? 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 border border-slate-200'
											: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
									}`}
								>
									{isFollowing ? (
										<>
											<UserCheck className="w-4 h-4 text-emerald-600" />
											<span>Đang theo dõi</span>
										</>
									) : (
										<>
											<UserPlus className="w-4 h-4" />
											<span>Theo dõi</span>
										</>
									)}
								</button>
							)}

							{/* Nút Chỉnh sửa trang CLB (Chỉ hiện khi là Admin/Mod) */}
							{canEditClub && (
								<button
									onClick={onOpenEditClubModal}
									className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-xl border border-slate-200/60 shadow-sm transition-all active:scale-95"
								>
									<Settings className="w-4 h-4 text-slate-500" />
									<span>Chỉnh sửa trang CLB</span>
								</button>
							)}
						</div>

					</div>

					{/* Mô tả câu lạc bộ */}
					{club?.description && (
						<p className="text-xs sm:text-sm text-slate-600 border-t border-slate-100 pt-3 leading-relaxed">
							{club.description}
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
