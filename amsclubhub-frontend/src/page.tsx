'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, Users, PlusCircle } from 'lucide-react';

interface Club {
  id: string | number;
  name: string;
  code: string;
  category?: string;
  description?: string;
  logo_url?: string | null;
  banner_url?: string | null;
  facebook_url?: string | null;
  contact_email?: string | null;
  is_active?: boolean;
  followers_count?: number;
}

export default function HomePage() {
  const router = useRouter();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
	const token = localStorage.getItem('access_token');
	if (!token) {
	  router.push('/login');
	  return;
	}

	api.get('/clubs')
	  .then((res) => setClubs(res.data))
	  .catch((err) => console.error(err))
	  .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = () => {
	localStorage.removeItem('access_token');
	router.push('/login');
  };

  return (
	<div className="min-h-screen bg-slate-50">
	  <header className="border-b bg-white shadow-sm">
		<div className="mx-auto flex max-w-6xl items-center justify-between p-4">
		  <div className="flex items-center gap-2">
			<Users className="h-6 w-6 text-blue-600" />
			<h1 className="text-xl font-bold tracking-tight">AmsClubHub</h1>
		  </div>
		  <Button variant="outline" size="sm" onClick={handleLogout}>
			<LogOut className="mr-2 h-4 w-4" /> Đăng xuất
		  </Button>
		</div>
	  </header>

	  <main className="mx-auto max-w-6xl p-6">
		<div className="mb-8 flex items-center justify-between">
		  <div>
			<h2 className="text-3xl font-bold tracking-tight">Danh sách Câu lạc bộ</h2>
			<p className="text-slate-500">Khám phá và đăng ký tham gia các CLB tại Chuyên Hà Nội - Amsterdam</p>
		  </div>
		  <Button>
			<PlusCircle className="mr-2 h-4 w-4" /> Tạo CLB mới
		  </Button>
		</div>

		{loading ? (
		  <p className="text-center text-slate-500">Đang tải danh sách CLB...</p>
		) : (
		  // Club được định nghĩa ở đây
		  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			{clubs.map((club) => (
			  <Card 
				key={club.id} 
				className="transition-all hover:shadow-md cursor-pointer"
				onClick={() => router.push(`/clubs/${club.id}`)}
			  >
				<CardHeader className="flex flex-row items-center gap-4">
				  <Avatar className="h-12 w-12 border bg-blue-50 text-blue-600 font-bold">
					<AvatarFallback>{club.code.substring(0, 3)}</AvatarFallback>
				  </Avatar>
				  <div>
					<CardTitle className="text-lg">{club.name}</CardTitle>
					<span className="inline-block rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
					  #{club.code}
					</span>
				  </div>
				</CardHeader>
				<CardContent>
				  <CardDescription className="line-clamp-3 text-slate-600">
					{club.description || 'Chưa có mô tả cho câu lạc bộ này.'}
				  </CardDescription>
				</CardContent>
			  </Card>
			))}
		  </div>
		)}
	  </main>
	</div>
  );
}