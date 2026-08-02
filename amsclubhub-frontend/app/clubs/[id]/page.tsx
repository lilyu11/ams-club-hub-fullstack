'use client';

import { useEffect, useState} from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { ArrowLeft, Users, FileText, BellRing, CheckCircle2, PlusCircle, Loader2 } from 'lucide-react';

// Interface cho người dùng
interface UserProfile {
  id: number;
  email: string;
  role: 'super_admin' | 'club_admin' | 'student';
  club_id?: number; // ID câu lạc bộ mà người này quản lý (nếu là club_admin)
}

// Interface cho Câu lạc bộ
interface ClubDetail {
  id: number;
  name: string;
  code: string;
  description: string;
}

// Interface cho bài đăng
interface Post {
  id: number;
  title: string;
  content: string;
  created_at?: string;
}

export default function ClubDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clubId = params.id;

  const [club, setClub] = useState<ClubDetail | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null); // State lưu người dùng hiện tại
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  // State quản lý Modal tạo bài đăng
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!clubId) return;

    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchClubData = async () => {
      try {
        // 1. Lấy thông tin người dùng đang đăng nhập
        try {
          const userRes = await api.get('/users/me');
          setCurrentUser(userRes.data);
		  // DEBUG
		  console.log('📌 [DEBUG] Current User từ /me:', userRes.data);
          console.log('📌 [DEBUG] ID CLB hiện tại trên URL:', clubId);
        } catch (e) {
          console.log('Chưa có endpoint /me hoặc chưa kết nối API User.');
        }

        // 2. Lấy thông tin CLB
        const clubRes = await api.get(`/clubs/${clubId}`);
        setClub(clubRes.data);

        // 3. Lấy danh sách bài đăng của CLB
        try {
		  const postsRes = await api.get('/posts', {
		  params: {
		  club_identifier: clubId, // Truyền UUID của CLB vào param
		    },
		  });
		  setPosts(postsRes.data);
		} catch (e) {
          console.log('Chưa có bài đăng nào hoặc backend chưa sẵn sàng endpoint lấy bài đăng.');
        }

        // 4. Lấy trạng thái follow từ Backend
        try {
          const followRes = await api.get(`/clubs/${clubId}/is-following`);
          setIsFollowing(followRes.data.is_following); // Backend trả về { is_following: true/false }
        } catch (e) {
          console.log('Chưa có endpoint kiểm tra follow.');
        }
      } catch (err) {
        console.error('Lỗi tải thông tin CLB:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchClubData();
  }, [clubId, router]);

  // Logic kiểm tra quyền đăng bài (Check cả ID số lẫn UUID)
  const userRole = currentUser?.role?.toLowerCase();
  const isSuperAdmin = userRole === 'super_admin' || userRole === 'admin';
  
  // Ép cả 2 về String() để so sánh chính xác chuỗi UUID
  const isCurrentClubAdmin =
    (userRole === 'club_admin' || userRole === 'admin') &&
    String(currentUser?.club_id) === String(clubId);

  const canCreatePost = isSuperAdmin || isCurrentClubAdmin;

  // Hàm xử lý tạo bài đăng mới
  const handleCreatePost = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!postTitle.trim() || !postContent.trim()) return;

    setSubmitting(true);
    try {
      // 1. Gửi dữ liệu bài đăng mới lên Backend
      const response = await api.post(`/clubs/${clubId}/posts`, {
		type: 'RECRUITMENT', // Hoặc 'EVENT' tùy loại bài đăng
        title: postTitle,
        content: postContent,
      });

      // 2. Thêm bài đăng mới vào danh sách hiển thị trên giao diện ngay lập tức
      const newPost = response.data || {
        id: Date.now(),
        title: postTitle,
        content: postContent,
      };
      setPosts([newPost, ...posts]);

      // 3. Reset form và đóng Dialog Modal
      setPostTitle('');
      setPostContent('');
      setIsDialogOpen(false);
      alert('Đăng bài thành công!');
    } catch (err) {
      console.error('Lỗi tạo bài đăng:', err);
      // Giả lập thêm bài đăng vào state phòng trường hợp Backend chưa hoàn thiện API này
      const mockPost: Post = {
        id: Date.now(),
        title: postTitle,
        content: postContent,
      };
      setPosts([mockPost, ...posts]);
      setPostTitle('');
      setPostContent('');
      setIsDialogOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleFollow = async () => {
    const prevStatus = isFollowing;
  	setIsFollowing(!prevStatus);

	try {
    await api.post(`/clubs/${clubId}/follow`);
  	} catch (err) {
    console.error('Lỗi khi follow:', err);
    setIsFollowing(prevStatus); // Nếu lỗi thì trả lại trạng thái cũ
  	}
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-slate-500">Đang tải thông tin...</div>;
  }

  if (!club) {
    return <div className="flex h-screen items-center justify-center text-slate-500">Không tìm thấy câu lạc bộ.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Header */}
      <div className="border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between p-4">
          <Button variant="ghost" onClick={() => router.push('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại trang chủ
          </Button>
          <Button onClick={handleToggleFollow} variant={isFollowing ? 'outline' : 'default'}>
            {isFollowing ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" /> Đang theo dõi
              </>
            ) : (
              <>
                <BellRing className="mr-2 h-4 w-4" /> Theo dõi
              </>
            )}
          </Button>
        </div>
      </div>

      <main className="mx-auto max-w-5xl p-6 space-y-6">
        {/* Banner thông tin CLB */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="h-20 w-20 border bg-blue-50 text-blue-600 text-xl font-bold">
              <AvatarFallback>{club.code.substring(0, 3)}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">{club.name}</h1>
                <span className="rounded bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                  #{club.code}
                </span>
              </div>
              <p className="text-slate-600 max-w-2xl">{club.description || 'Chưa có mô tả chi tiết.'}</p>
            </div>
          </div>
        </div>

        {/* Nội dung chính */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Cột trái: Bài đăng tuyển quân */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-bold">Bài đăng tuyển thành viên & Sự kiện</h2>
              </div>

              {/* CHỈ HIỂN THỊ NÚT VÀ DIALOG KHI CÓ QUYỀN (ADMIN) */}
              {canCreatePost && (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <PlusCircle className="mr-2 h-4 w-4" /> Đăng bài mới
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md bg-white">
                    <DialogHeader>
                      <DialogTitle>Tạo bài đăng tuyển thành viên / Sự kiện</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreatePost} className="space-y-4 mt-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Tiêu đề bài viết</label>
                        <Input
                          placeholder="Ví dụ: [Tuyển thành viên 2026] Mở đơn đăng ký đợt 1"
                          value={postTitle}
                          onChange={(e) => setPostTitle(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Nội dung chi tiết</label>
                        <Textarea
                          placeholder="Nhập yêu cầu, link điền đơn hoặc mô tả sự kiện..."
                          rows={5}
                          value={postContent}
                          onChange={(e) => setPostContent(e.target.value)}
                          required
                        />
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                          Hủy
                        </Button>
                        <Button type="submit" disabled={submitting}>
                          {submitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang tiến hành đăng bài...
                            </>
                          ) : (
                            'Đăng bài'
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {/* Danh sách bài đăng */}
            {posts.length === 0 ? (
              <Card className="p-8 text-center text-slate-500 bg-white">
                CLB này hiện chưa có bài đăng nào.
              </Card>
            ) : (
              posts.map((post) => (
                <Card key={post.id} className="bg-white">
                  <CardHeader>
                    <CardTitle className="text-lg">{post.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600 whitespace-pre-line">{post.content}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Cột phải: Người theo dõi */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-bold">Người theo dõi</h2>
            </div>
            <Card className="bg-white p-4">
              <div className="space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-between border-b pb-2">
                  <span>Đàm Vĩnh Hưng (Đàm tổng)</span>
                  <span className="text-xs text-slate-400">Học sinh</span>
                </div>
                <div className="flex items-center justify-between border-b pb-2">
                  <span>Nghiêm Vũ Hoàng Long (MCK)</span>
                  <span className="text-xs text-slate-400">Học sinh</span>
                </div>
                <p className="text-xs text-slate-400 text-center pt-2">Và nhiều thành viên khác...</p>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}