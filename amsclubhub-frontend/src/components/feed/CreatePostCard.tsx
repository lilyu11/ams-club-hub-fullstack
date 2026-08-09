'use client'; // UNDONE

import { useState, useEffect } from 'react';
import { Image as ImageIcon, Send, Sparkles, User } from 'lucide-react';
import api from '@/lib/api';
import { getFullImageUrl } from '@/lib/utils';

interface ClubOption {
  id: number;
  name: string;
}

export default function CreatePostCard({ onPostCreated }: { onPostCreated?: () => void }) {
  const [content, setContent] = useState('');
  const [clubs, setClubs] = useState<ClubOption[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<number | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lấy thông tin user & danh sách CLB user quản lý/tham gia
  useEffect(() => {
	const initData = async () => {
	  try {
		const [userRes, clubsRes] = await Promise.allSettled([
		  api.get('/users/me'),
		  api.get('/clubs'),
		]);

		if (userRes.status === 'fulfilled') {
		  setUserAvatar(userRes.value.data?.avatar_url || null);
		}

		if (clubsRes.status === 'fulfilled') {
		  const clubData = Array.isArray(clubsRes.value.data)
			? clubsRes.value.data
			: clubsRes.value.data?.items || [];
		  setClubs(clubData);
		  if (clubData.length > 0) setSelectedClubId(clubData[0].id);
		}
	  } catch (err) {
		console.error('Lỗi khởi tạo CreatePostCard:', err);
	  }
	};

	initData();
  }, []);

  const handleSubmit = async () => {
	if (!content.trim() || !selectedClubId) return;

	setIsSubmitting(true);
	try {
	  await api.post('/posts', {
		title: content.slice(0, 50) + (content.length > 50 ? '...' : ''), // Tự động tạo title ngắn
		content: content,
		club_id: selectedClubId,
	  });

	  setContent('');
	  if (onPostCreated) onPostCreated();
	} catch (err) {
	  console.error('Lỗi khi đăng bài:', err);
	  alert('Không thể đăng bài. Vui lòng kiểm tra lại quyền truy cập!');
	} finally {
	  setIsSubmitting(false);
	}
  };

  return (
	<div className="p-4 border-b border-border bg-card/30">
	  <div className="flex gap-3">
		{/* Avatar Người đăng */}
		{userAvatar ? (
		  <img
			src={getFullImageUrl(userAvatar)}
			alt="Avatar"
			className="w-10 h-10 rounded-full object-cover shrink-0 border border-border"
		  />
		) : (
		  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
			<User className="w-5 h-5" />
		  </div>
		)}

		<div className="flex-1 space-y-3">
		  {/* Ô nhập nội dung */}
		  <textarea
			value={content}
			onChange={(e) => setContent(e.target.value)}
			placeholder="Hôm nay CLB của bạn có tin gì mới?"
			rows={3}
			className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none"
		  />

		  {/* Thanh công cụ phía dưới */}
		  <div className="flex items-center justify-between pt-2 border-t border-border/50">
			<div className="flex items-center gap-2">
			  {/* Chọn CLB đăng bài */}
			  {clubs.length > 0 && (
				<select
				  value={selectedClubId || ''}
				  onChange={(e) => setSelectedClubId(Number(e.target.value))}
				  className="bg-muted text-xs font-semibold text-foreground px-2.5 py-1.5 rounded-lg border border-border focus:outline-none cursor-pointer"
				>
				  {clubs.map((club) => (
					<option key={club.id} value={club.id}>
					  {club.name}
					</option>
				  ))}
				</select>
			  )}

			  <button
				type="button"
				className="p-2 text-primary hover:bg-primary/10 rounded-full transition"
				title="Thêm hình ảnh"
			  >
				<ImageIcon className="w-4 h-4" />
			  </button>
			</div>

			<button
			  onClick={handleSubmit}
			  disabled={!content.trim() || isSubmitting}
			  className="flex items-center gap-1.5 bg-primary text-primary-foreground font-bold px-4 py-1.5 rounded-full text-xs hover:opacity-90 disabled:opacity-50 transition"
			>
			  {isSubmitting ? (
				<Sparkles className="w-3.5 h-3.5 animate-spin" />
			  ) : (
				<Send className="w-3.5 h-3.5" />
			  )}
			  Đăng bài
			</button>
		  </div>
		</div>
	  </div>
	</div>
  );
}