'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getFullImageUrl } from '@/lib/utils'; // Import hàm nối domain ảnh chuẩn
import { UserProfile, ClubDetail, Post } from '@/types/club';

// Import các Component nhỏ
import ClubHeader from '@/components/club/ClubHeader';
import ClubEditModal from '@/components/club/ClubEditModal';
import ClubFollowers from '@/components/club/ClubFollowers';
import PostCard from '@/components/post/PostCard';
import PostModal from '@/components/post/PostModal';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FileText, PlusCircle } from 'lucide-react';

// Ảnh mặc định an toàn tuyệt đối khi DB chưa có ảnh
const DEFAULT_BANNER = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&h=400&auto=format&fit=crop&q=80';
const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&auto=format&fit=crop&q=80';

// ✅ HÀM LỌC ẢNH ĐÃ SỬA: Không chặn /static/images/ nữa và bọc qua getFullImageUrl
const sanitizeImageUrl = (url: string | null | undefined, defaultUrl: string) => {
  if (!url || url.trim() === '' || url.includes('via.placeholder.com')) {
    return defaultUrl;
  }
  return getFullImageUrl(url);
};

export default function ClubDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clubId = params?.id as string;

  // States
  const [club, setClub] = useState<ClubDetail | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  // States Modal Bài đăng
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postFormUrl, setPostFormUrl] = useState('');
  const [postImageUrl, setPostImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

	// State lưu dữ liệu thô từ API để map sang Form khi mở Modal Sửa CLB
	const [rawClubData, setRawClubData] = useState<any>(null);

  // States Modal Sửa CLB
  const [isEditClubOpen, setIsEditClubOpen] = useState(false);
  const [clubFormData, setClubFormData] = useState({
    name: '',
    description: '',
    category: '',
    logo_url: '',
    banner_url: '',
    facebook_url: '',
    contact_email: '',
  });

	// Hàm hỗ trợ map dữ liệu thô từ DB sang Form
  const mapRawDataToForm = (data: any) => ({
    name: data?.name || '',
    description: data?.description || '',
    category: data?.category || '',
    logo_url: data?.logo_url || '',
    banner_url: data?.banner_url || data?.banner_urls?.[0] || '',
    facebook_url: data?.facebook_url || '',
    contact_email: data?.contact_email || '',
  });

  useEffect(() => {
    if (!clubId) return;

    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
      return;
    }

    const initData = async () => {
      try {
        try {
          const userRes = await api.get('/users/me');
          setCurrentUser(userRes.data);
        } catch (e) {
          console.log('Chưa kết nối API /users/me.');
        }

        // 1. Tải thông tin CLB & Xử lý fallback ảnh
        const clubRes = await api.get(`/clubs/${clubId}`);
        const rawClub = clubRes.data;

        // Lấy cả banner_url lẫn banner_urls nếu backend dùng 1 trong 2
        const rawBanner = rawClub.banner_url || rawClub.banner_urls?.[0];
        const logo = sanitizeImageUrl(rawClub.logo_url, DEFAULT_AVATAR);
        const banner = sanitizeImageUrl(rawBanner, DEFAULT_BANNER);
        const description = rawClub.description || 'Câu lạc bộ này chưa có mô tả.';

        const processedClub = {
          ...rawClub,
          logo_url: logo,
          banner_url: banner,
          description: description,
        };

        setClub(processedClub);
        setClubFormData({
          name: rawClub.name || '',
          description: description,
          category: rawClub.category || '',
          logo_url: rawClub.logo_url || '',
          banner_url: rawBanner || '',
          facebook_url: rawClub.facebook_url || '',
          contact_email: rawClub.contact_email || '',
        });

        // 2. Tải bài đăng
        try {
          const postsRes = await api.get('/posts', {
            params: { club_identifier: clubId },
          });
          setPosts(postsRes.data);
        } catch (e) {
          console.log('Chưa có bài đăng nào.');
        }

        // 3. Tải trạng thái Follow
        try {
          const followRes = await api.get(`/clubs/${clubId}/is-following`);
          setIsFollowing(followRes.data.is_following);
        } catch (e) {
          console.log('Chưa có endpoint follow.');
        }
      } catch (err) {
        console.error('Lỗi tải dữ liệu:', err);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [clubId, router]);

  // Phân quyền
  const userRole = currentUser?.role?.toLowerCase();
  const isSuperAdmin = userRole === 'super_admin' || userRole === 'admin';
  const isCurrentClubAdmin =
    (userRole === 'club_admin' || userRole === 'admin') &&
    String(currentUser?.club_id) === String(clubId);
  const canEditClub = isSuperAdmin || isCurrentClubAdmin;

  // Handlers
  const handleToggleFollow = async () => {
    const prevStatus = isFollowing;
    setIsFollowing(!prevStatus);
    try {
      await api.post(`/clubs/${clubId}/follow`);
    } catch (err) {
      setIsFollowing(prevStatus);
    }
  };

  // CẬP NHẬT THÔNG TIN CÂU LẠC BỘ 
  const handleSaveClubProfile = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!club) return;

    try {
      const payload = {
        name: clubFormData.name?.trim() || '',
        category: clubFormData.category?.trim() || '',
        description: clubFormData.description?.trim() || '',
        logo_url: clubFormData.logo_url?.trim() || '',
        banner_url: clubFormData.banner_url?.trim() || '',
        facebook_url: clubFormData.facebook_url?.trim() || '',
        contact_email: clubFormData.contact_email?.trim() || '',
      };

      const response = await api.put(`/clubs/${club.id}`, payload);
      if (response.status === 200 || response.status === 201) {
        alert('Cập nhật thông tin CLB thành công!');

        // Đọc lại thông tin đã cập nhật từ phản hồi API
        let rawUpdated = response.data;
        try {
          const refreshedRes = await api.get(`/clubs/${club.id}`);
          if (refreshedRes.data) rawUpdated = refreshedRes.data;
        } catch (e) {
          console.log('Dùng response data từ PUT');
        }

        const rawBanner = rawUpdated.banner_url || rawUpdated.banner_urls?.[0] || payload.banner_url;
        const rawLogo = rawUpdated.logo_url || payload.logo_url;

        const logo = sanitizeImageUrl(rawLogo, DEFAULT_AVATAR);
        const banner = sanitizeImageUrl(rawBanner, DEFAULT_BANNER);
        const description = rawUpdated.description || payload.description;

        const updatedClub = {
          ...rawUpdated,
          name: rawUpdated.name || payload.name,
          category: rawUpdated.category || payload.category,
          logo_url: logo,
          banner_url: banner,
          description: description,
          facebook_url: rawUpdated.facebook_url || payload.facebook_url,
          contact_email: rawUpdated.contact_email || payload.contact_email,
        };

        // Cập nhật State để Render lại giao diện ngay lập tức
        setClub(updatedClub);
        setClubFormData({
          name: updatedClub.name || '',
          description: description,
          category: updatedClub.category || '',
          logo_url: rawLogo || '',
          banner_url: rawBanner || '',
          facebook_url: updatedClub.facebook_url || '',
          contact_email: updatedClub.contact_email || '',
        });

        setIsEditClubOpen(false);
      }
    } catch (err: any) {
      console.error('Lỗi khi cập nhật CLB:', err);
      alert(`Cập nhật thất bại: ${err?.response?.data?.detail || err.message || 'Lỗi kết nối'}`);
    }
  };

  const handleCreateOrUpdatePost = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!postTitle.trim() || !postContent.trim()) return;

    setSubmitting(true);
    try {
      const payload = {
        type: 'RECRUITMENT',
        title: postTitle,
        content: postContent,
        application_form_url: postFormUrl.trim() || null,
        image_url: postImageUrl.trim() || null,
      };

      if (editingPost) {
        const res = await api.put(`/posts/${editingPost.id}`, payload);
        setPosts((prev) => prev.map((p) => (p.id === editingPost.id ? res.data : p)));
        alert('Cập nhật bài viết thành công!');
      } else {
        await api.post(`/clubs/${clubId}/posts`, payload);
        const postsRes = await api.get('/posts', { params: { club_identifier: clubId } });
        setPosts(postsRes.data);
        alert('Đăng bài thành công!');
      }

      setPostTitle('');
      setPostContent('');
      setPostFormUrl('');
      setPostImageUrl('');
      setIsPostDialogOpen(false);
      setEditingPost(null);
    } catch (err) {
      alert('Có lỗi xảy ra khi lưu bài đăng.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async (postId: number | string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bài viết này không?')) return;
    try {
      await api.delete(`/posts/${postId}`);
      setPosts((prev) => prev.filter((p) => String(p.id) !== String(postId)));
      alert('Đã xóa bài viết!');
    } catch (err) {
      alert('Xóa bài thất bại!');
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center text-slate-500">Đang tải thông tin...</div>;
  if (!club) return <div className="flex h-screen items-center justify-center text-slate-500">Không tìm thấy câu lạc bộ.</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <main className="mx-auto max-w-5xl p-6 space-y-6">
        <ClubHeader
          club={club}
          isFollowing={isFollowing}
          canEditClub={canEditClub}
          onToggleFollow={handleToggleFollow}
          onOpenEditClubModal={() => {
						const dataToUse = rawClubData || club;
            if (dataToUse) {
              setClubFormData(mapRawDataToForm(dataToUse));
            }
            setIsEditClubOpen(true);
          }}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-bold">Bài đăng tuyển thành viên/Sự kiện</h2>
              </div>

              {canEditClub && (
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingPost(null);
                    setPostTitle('');
                    setPostContent('');
                    setPostFormUrl('');
                    setPostImageUrl('');
                    setIsPostDialogOpen(true);
                  }}
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Đăng bài mới
                </Button>
              )}
            </div>

            {posts.length === 0 ? (
              <Card className="p-8 text-center text-slate-500 bg-white">
                Câu lạc bộ này hiện chưa có bài đăng nào.
              </Card>
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  canEditClub={canEditClub}
                  onEdit={(p: Post) => {
                    setEditingPost(p);
                    setPostTitle(p.title);
                    setPostContent(p.content);
                    setPostFormUrl(p.application_form_url || '');
                    setPostImageUrl(p.image_url || '');
                    setIsPostDialogOpen(true);
                  }}
                  onDelete={handleDeletePost}
                />
              ))
            )}
          </div>

          <ClubFollowers />
        </div>
        
        {canEditClub && (
          <ClubEditModal
            isOpen={isEditClubOpen}
            onClose={() => setIsEditClubOpen(false)}
            formData={clubFormData}
            setFormData={setClubFormData}
            onSubmit={handleSaveClubProfile}
          />
        )}

        <PostModal
          isOpen={isPostDialogOpen}
          onClose={() => setIsPostDialogOpen(false)}
          editingPost={editingPost}
          postTitle={postTitle}
          setPostTitle={setPostTitle}
          postContent={postContent}
          setPostContent={setPostContent}
          postFormUrl={postFormUrl}
          setPostFormUrl={setPostFormUrl}
          postImageUrl={postImageUrl}
          setPostImageUrl={setPostImageUrl}
          submitting={submitting}
          onSubmit={handleCreateOrUpdatePost}
        />
      </main>
    </div>
  );
}