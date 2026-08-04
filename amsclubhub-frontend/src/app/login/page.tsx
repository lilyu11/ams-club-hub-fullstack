'use client';

import { SubmitEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LogIn, Loader2 } from 'lucide-react';

export default function LoginPage() {
	const router = useRouter();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	const handleLogin = async (e: SubmitEvent<HTMLFormElement>) => {
		e.preventDefault();
		setLoading(true);
		setError('');

		try {
		// FastAPI Auth mặc định dùng Form-Data (username & password)
		const formData = new URLSearchParams();
		formData.append('username', email);
		formData.append('password', password);

		const response = await api.post('/auth/login', formData, {
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		});

		// Lưu Token vào localStorage
		const { access_token } = response.data;
		localStorage.setItem('access_token', access_token);

		// alert('Đăng nhập thành công!');
		
		// Chuyển hướng sang trang chủ
		router.push('/');
		} catch (err: any) {
		console.error(err);
		setError(err.response?.data?.detail || 'Email hoặc mật khẩu không chính xác!');
		} finally {
		setLoading(false);
		}
  };

  return (
	<div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
		<Card className="w-full max-w-md shadow-lg">
			<CardHeader className="space-y-1 text-center">
			<CardTitle className="text-2xl font-bold tracking-tight">AmsClubHub</CardTitle>
			<CardDescription>Đăng nhập để quản lý và tham gia các câu lạc bộ</CardDescription>
			</CardHeader>
			<CardContent>
			<form onSubmit={handleLogin} className="space-y-4">
				{error && (
				<div className="rounded-md bg-red-50 p-3 text-sm text-red-500 font-medium">
					{error}
				</div>
				)}
				
				<div className="space-y-2">
				<label className="text-sm font-medium">Email trường / Học sinh</label>
				<Input
					type="email"
					placeholder="hocsinh@ams.edu.vn"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
				/>
				</div>

				<div className="space-y-2">
				<label className="text-sm font-medium">Mật khẩu</label>
				<Input
					type="password"
					placeholder="••••••••"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					required
				/>
				</div>

				<Button type="submit" className="w-full" disabled={loading}>
				{loading ? (
					<>
					<Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang xử lý...
					</>
				) : (
					<>
					<LogIn className="mr-2 h-4 w-4" /> Đăng nhập
					</>
				)}
				</Button>
			</form>
			</CardContent>
		</Card>
	</div>
  );
}