'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Calendar, Sparkles, Clock, AlertCircle, Users, CheckCircle2, Flame } from 'lucide-react';
import api from '@/lib/api';
import { PostData } from '@/types/club';
import { getFullImageUrl } from '@/lib/utils';

const CATEGORIES = ['Tất cả', 'Thể thao', 'Nghệ thuật', 'Học thuật', 'Xã hội'];

// Helper kiểm tra URL hợp lệ
const isValidUrlStr = (url?: string | null): boolean => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim().toLowerCase();
  return trimmed !== '' && trimmed !== 'string' && trimmed !== 'null';
};

// Hàm tách & phân tích thời gian (Đã bỏ chữ "Tháng", chỉ giữ định dạng số)
function parseEventDates(text?: string) {
  if (!text) return null;

  // Regex bắt khoảng thời gian dạng [Tháng ]M1/Y1 - [Tháng ]M2/Y2
  const rangeRegex = /(?:tháng\s*)?(\d{1,2})\/(\d{4})\s*-\s*(?:tháng\s*)?(\d{1,2})\/(\d{4})/i;
  const match = text.match(rangeRegex);

  if (match) {
    const m1 = parseInt(match[1], 10);
    const y1 = parseInt(match[2], 10);
    const m2 = parseInt(match[3], 10);
    const y2 = parseInt(match[4], 10);

    const startDate = new Date(y1, m1 - 1, 1);
    const endDate = new Date(y2, m2, 0, 23, 59, 59);

    // Format chỉ dạng số: "2/2026 - 3/2026"
    return { startDate, endDate, rawString: `${m1}/${y1} - ${m2}/${y2}` };
  }

  // Nếu chỉ ghi 1 tháng duy nhất
  const singleRegex = /(?:tháng\s*)?(\d{1,2})\/(\d{4})/i;
  const singleMatch = text.match(singleRegex);
  if (singleMatch) {
    const m = parseInt(singleMatch[1], 10);
    const y = parseInt(singleMatch[2], 10);

    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59);

    // Format chỉ dạng số: "4/2026"
    return { startDate, endDate, rawString: `${m}/${y}` };
  }

  return null;
}

// Component Thẻ Sự kiện (EventCard)
function EventCard({ event, timeBadge }: { event: PostData; timeBadge?: string }) {
  const [imgError, setImgError] = useState(false);

  const validRawUrl = isValidUrlStr(event.image_url) ? event.image_url : null;
  const imageUrl = validRawUrl ? getFullImageUrl(validRawUrl) : null;

  // Tên CLB ưu tiên lấy từ object club ghép vào
  const clubName = event.club?.name || event.club_name || 'Câu lạc bộ';

  return (
    <Link
      href={`/posts/${event.id}`}
      prefetch={false}
      className="group relative bg-white dark:bg-zinc-900/70 hover:bg-slate-50 dark:hover:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-800/80 hover:border-slate-300 dark:hover:border-zinc-700/80 rounded-2xl p-3.5 transition-all duration-200 flex flex-col shadow-sm hover:shadow-md"
    >
      <div className="relative w-full aspect-video sm:aspect-square rounded-xl overflow-hidden bg-zinc-800 mb-3 flex items-center justify-center">
        {imageUrl && !imgError ? (
          <Image
            src={imageUrl}
            alt={event.title || 'Event'}
            fill
            priority
            unoptimized
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-500/20 to-blue-500/20 flex items-center justify-center text-indigo-400 font-bold text-xl p-2 text-center">
            {event.title ? event.title.substring(0, 20) + '...' : 'EVENT'}
          </div>
        )}

        {/* Tag Category của CLB */}
        {event.club?.category && (
          <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-semibold bg-black/60 backdrop-blur-md text-white rounded-md z-10">
            {event.club.category}
          </span>
        )}

        {/* Badge thời gian dạng số gọn gàng trên ảnh */}
        {timeBadge && (
          <span className="absolute bottom-2 right-2 px-2 py-0.5 text-[10px] font-semibold bg-indigo-600/90 backdrop-blur-md text-white rounded-md z-10 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {timeBadge}
          </span>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-zinc-100 line-clamp-2 group-hover:text-blue-500 transition-colors">
            {event.title}
          </h3>
          
          {/* Hiển thị duy nhất dòng thời gian hoạt động */}
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 line-clamp-1 font-medium">
            Thời gian hoạt động:{' '}
            {timeBadge && timeBadge !== 'Đang diễn ra'
              ? `Tháng ${timeBadge}`
              : 'Đang cập nhật'}
          </p>
        </div>

        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100 dark:border-zinc-800/50 text-[11px] text-slate-500 dark:text-zinc-400">
          <Users className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 shrink-0" />
          <span className="truncate">{clubName}</span>
        </div>
      </div>
    </Link>
  );
}

// Main Event Page
export default function EventsPage() {
  const [events, setEvents] = useState<PostData[]>([]);
  const [followedClubIds, setFollowedClubIds] = useState<(string | number)[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [viewScope, setViewScope] = useState<'all' | 'followed'>('all');

  useEffect(() => {
    const fetchEventsData = async () => {
      setLoading(true);
      try {
        // Fetch đồng thời cả Posts và Clubs để ghép thông tin Category & Tên CLB
        const postsPromise = api.get('/posts', {
          params: { limit: 200, sort_by: 'created_at', order: 'desc' },
        });
        const clubsPromise = api.get('/clubs', { params: { limit: 100 } });
        const followedPromise =
          viewScope === 'followed' ? api.get('/clubs/followed/me') : Promise.resolve(null);

        const [postsRes, clubsRes, followedRes] = await Promise.all([
          postsPromise,
          clubsPromise,
          followedPromise,
        ]);

        // Tạo Map thông tin CLB từ danh sách Clubs
        const rawClubs = clubsRes.data?.data || clubsRes.data?.items || clubsRes.data || [];
        const clubsList = Array.isArray(rawClubs) ? rawClubs : [];
        const clubsMap = new Map<string | number, any>();
        clubsList.forEach((c: any) => clubsMap.set(c.id, c));

        // 2. Xử lý danh sách CLB Đã theo dõi
        if (followedRes && followedRes.data) {
          const rawFollowed =
            followedRes.data?.data || followedRes.data?.items || followedRes.data || [];
          const ids = Array.isArray(rawFollowed) ? rawFollowed.map((c: any) => c.id) : [];
          setFollowedClubIds(ids);
        }

        // 3. Xử lý danh sách Bài viết & Ghép thông tin CLB
        const rawPosts = postsRes.data?.data || postsRes.data?.items || postsRes.data || [];
        const postsList: PostData[] = Array.isArray(rawPosts)
          ? rawPosts
          : rawPosts.data || [];

        const enrichedEvents = postsList
          .filter((p) => p.type === 'EVENT')
          .map((p) => {
            const clubInfo = p.club || (p.club_id ? clubsMap.get(p.club_id) : null);
            return {
              ...p,
              club: clubInfo || p.club,
              club_name: p.club_name || clubInfo?.name || 'Câu lạc bộ',
            };
          });

        setEvents(enrichedEvents);
      } catch (error) {
        console.error('Lỗi khi tải danh sách sự kiện:', error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEventsData();
  }, [viewScope]);

  // Lọc sự kiện theo từ khóa & Danh mục CLB & Scope
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (viewScope === 'followed' && event.club_id) {
        if (!followedClubIds.includes(event.club_id)) return false;
      }

      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        event.title?.toLowerCase().includes(query) ||
        event.content?.toLowerCase().includes(query) ||
        event.club?.name?.toLowerCase().includes(query) ||
        event.club_name?.toLowerCase().includes(query);

      // Lọc theo danh mục của CLB
      const matchesCategory =
        selectedCategory === 'Tất cả' || event.club?.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [events, searchQuery, selectedCategory, viewScope, followedClubIds]);

  // Phân loại 3 nhóm sự kiện dựa vào thời gian
  const { ongoingEvents, upcomingEvents, pastEvents } = useMemo(() => {
    const now = new Date();
    const sixMonthsMs = 180 * 24 * 60 * 60 * 1000;

    const ongoing: { event: PostData; badge: string }[] = [];
    const upcoming: { event: PostData; badge: string }[] = [];
    const past: { event: PostData; badge: string }[] = [];

    filteredEvents.forEach((event) => {
      const parsed = parseEventDates(event.content);

      if (!parsed) {
        ongoing.push({ event, badge: 'Đang diễn ra' });
        return;
      }

      const { startDate, endDate, rawString } = parsed;

      if (now >= startDate && now <= endDate) {
        ongoing.push({ event, badge: rawString });
      } else if (startDate > now && startDate.getTime() - now.getTime() < sixMonthsMs) {
        upcoming.push({ event, badge: rawString });
      } else if (endDate < now) {
        const createdAt = event.created_at ? new Date(event.created_at) : endDate;
        if (now.getTime() - createdAt.getTime() < sixMonthsMs) {
          past.push({ event, badge: rawString });
        }
      }
    });

    return { ongoingEvents: ongoing, upcomingEvents: upcoming, pastEvents: past };
  }, [filteredEvents]);

  const hasNoResults =
    ongoingEvents.length === 0 && upcomingEvents.length === 0 && pastEvents.length === 0;

  return (
    <div className="p-4 sm:p-6 space-y-6 min-h-screen pb-20">
      {/* Header & Thanh tìm kiếm */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-7 h-7 text-blue-500" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-100">
              Sự kiện
            </h1>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm sự kiện theo tên, câu lạc bộ, nội dung..."
            className="w-full pl-11 pr-4 py-3 bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/60 rounded-2xl text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
        </div>
      </div>

      {/* Bộ lọc Scope & Categories */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-b border-slate-200/60 dark:border-zinc-800/80 pb-4">
        <div className="flex items-center bg-slate-100 dark:bg-zinc-800/80 p-1 rounded-xl mr-2">
          <button
            type="button"
            onClick={() => setViewScope('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              viewScope === 'all'
                ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-zinc-100 shadow-sm'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
            }`}
          >
            Tất cả
          </button>
          <button
            type="button"
            onClick={() => setViewScope('followed')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              viewScope === 'followed'
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
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-slate-100 dark:bg-zinc-800/60 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Danh sách sự kiện */}
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
      ) : hasNoResults ? (
        <div className="text-center py-16 bg-slate-50 dark:bg-zinc-900/40 border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl">
          <Sparkles className="w-10 h-10 text-slate-400 dark:text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-zinc-200">
            Không tìm thấy sự kiện nào
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1">
            Thử thay đổi từ khóa tìm kiếm hoặc chọn danh mục khác.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Hàng 1: Đang diễn ra */}
          {ongoingEvents.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-indigo-500 dark:text-indigo-400">
                <CheckCircle2 className="w-5 h-5" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-100">
                  Đang diễn ra ({ongoingEvents.length})
                </h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {ongoingEvents.map(({ event, badge }) => (
                  <EventCard key={event.id} event={event} timeBadge={badge} />
                ))}
              </div>
            </section>
          )}

          {/* Hàng 2: Sắp diễn ra */}
          {upcomingEvents.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-amber-500 dark:text-amber-400">
                <Clock className="w-5 h-5" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-100">
                  Sắp diễn ra ({upcomingEvents.length})
                </h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {upcomingEvents.map(({ event, badge }) => (
                  <EventCard key={event.id} event={event} timeBadge={badge} />
                ))}
              </div>
            </section>
          )}

          {/* Hàng 3: Đã qua */}
          {pastEvents.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                <AlertCircle className="w-5 h-5" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-100">
                  Đã qua ({pastEvents.length})
                </h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 opacity-80">
                {pastEvents.map(({ event, badge }) => (
                  <EventCard key={event.id} event={event} timeBadge={badge} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}