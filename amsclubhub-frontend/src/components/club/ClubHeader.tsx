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
    <div className="w-full space-y-3 font-sans text-white">
      {/* 1. TOP BAR / NÚT QUAY VỀ TRANG CHỦ */}
      <div className="flex items-center gap-4 py-1 px-1">
        <Link
          href="/"
          className="p-2 rounded-full hover:bg-neutral-900 text-white transition-all border border-neutral-800"
          title="Quay về trang chủ"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-base font-bold text-white leading-tight flex items-center gap-1.5">
            {club?.name || 'Câu lạc bộ'}
            <CheckCircle2 className="w-4 h-4 text-sky-500 fill-sky-500/20 inline" />
          </h2>
          <p className="text-xs text-neutral-400">
            {club?.followers_count || 0} người theo dõi
          </p>
        </div>
      </div>

      {/* 2. KHU VỰC HEADER (BANNER + LOGO + THÔNG TIN) */}
      <div className="w-full bg-black rounded-3xl border border-neutral-800 shadow-2xl overflow-hidden">
        {/* Banner tỉ lệ X */}
        <div className="relative w-full aspect-[3/1] sm:aspect-[16/5] bg-neutral-900 overflow-hidden">
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
            
            {/* Logo tròn viền đen đậm */}
            <div className="relative h-24 w-24 sm:h-32 sm:w-32 rounded-full border-4 border-black bg-black shadow-2xl overflow-hidden shrink-0">
              <img
                src={getFullImageUrl(club?.logo_url) || '/static/images/default-logo.png'}
                alt={club?.name}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://placehold.co/300x300/18181b/fff?text=Logo';
                }}
              />
            </div>

            {/* CÁC NÚT THAO TÁC (REMIND ME HOẶC CHỈNH SỬA PROFILE) */}
            <div className="flex items-center gap-2 mb-1">
              {/* Nút Remind Me / Follow */}
              {onToggleFollow && (
                <button
                  onClick={onToggleFollow}
                  className={`flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-bold rounded-full transition-all active:scale-95 ${
                    isFollowing
                      ? 'bg-neutral-900 text-white border border-neutral-700 hover:bg-neutral-800'
                      : 'bg-white text-black hover:bg-neutral-200'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <BellRing className="w-4 h-4 text-sky-400 fill-sky-400/20" />
                      <span>Đã bật thông báo</span>
                    </>
                  ) : (
                    <>
                      <Bell className="w-4 h-4" />
                      <span>Thông báo</span>
                    </>
                  )}
                </button>
              )}

              {/* Nút Chỉnh sửa CLB */}
              {canEditClub && (
                <button
                  onClick={onOpenEditClubModal}
                  className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-black hover:bg-neutral-900 rounded-full border border-neutral-700 transition-all active:scale-95"
                >
                  <Settings className="w-4 h-4 text-neutral-400" />
                  <span>Chỉnh sửa</span>
                </button>
              )}
            </div>
          </div>

          {/* Tên & Mã CLB */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-1.5">
                {club?.name}
                <CheckCircle2 className="w-5 h-5 text-sky-500 fill-sky-500/20" />
              </h1>
            </div>

            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <span className="px-2.5 py-0.5 rounded-full bg-neutral-900 text-neutral-300 border border-neutral-800 uppercase">
                #{club?.code ? club.code : 'CLUB'}
              </span>
              {/* <span>•</span> */}
              <span className="px-2.5 py-0.5 rounded-full bg-neutral-900 text-neutral-300 border border-neutral-800">
                {club?.category || 'Chưa phân loại'}
              </span>
            </div>
          </div>

          {/* Mô tả câu lạc bộ */}
          {club?.description && (
            <p className="text-sm text-neutral-200 mt-3 leading-relaxed whitespace-pre-line">
              {club.description}
            </p>
          )}

          {/* Stats người theo dõi */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-neutral-800/80 text-xs sm:text-sm text-neutral-400">
            <div>
              <strong className="text-white font-bold">{club?.followers_count || 0}</strong>{' '}
              <span>Người theo dõi</span>
            </div>
            {club?.contact_email && (
              <div>
                <span className="text-neutral-600">•</span>{' '}
                <span className="text-neutral-400">{club.contact_email}</span>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}