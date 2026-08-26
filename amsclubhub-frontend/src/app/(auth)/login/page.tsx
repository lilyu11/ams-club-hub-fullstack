'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';

// Maskot
import pigeonImg from './pigeon.png';

type AuthMode = 'login' | 'register' | 'forgot';
type AuthStep = 'form' | 'otp';

interface FeedbackState {
	type: 'error' | 'success' | 'idle';
	text: string;
}

const IDLE_MESSAGES = [
	'Xin chào người đẹp ~ *Nhìn chằm chằm*',
	'Cậu ăn cơm chưa..?',
	'Nếu cần hỗ trợ, hãy gọi tôi và cầm ít bánh mì',
	'Yên tâm, mình không nhìn trộm mật khẩu đâu ~',
	'Nhìn gì mà nhìn ? Ai cho mà nhìn ?',
];

export default function AuthPage() {
	const router = useRouter();

	// Mode & Step
	const [mode, setMode] = useState<AuthMode>('login');
	const [step, setStep] = useState<AuthStep>('form');

	// Form State
	const [fullName, setFullName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [otp, setOtp] = useState('');

	// UI State
	const [showPassword, setShowPassword] = useState(false);
	const [rememberMe, setRememberMe] = useState(false);
	const [loading, setLoading] = useState(false);

	// Handle đổi mật khẩu từ URL
	const searchParams = useSearchParams();
	const isForgotPassword = searchParams.get('forgotPassword') === 'true';
	const initialEmail = searchParams.get('email') || '';

	// 1 Trạng thái thông báo duy nhất (Mặc định hiển thị lời chào)
	const [feedback, setFeedback] = useState<FeedbackState>({
		type: 'idle',
		text: IDLE_MESSAGES[0],
	});

	// Tự động điền email và chuyển mode sang 'forgot' khi chuyển hướng từ Profile
	useEffect(() => {
		if (isForgotPassword) {
			setMode('forgot');
			if (initialEmail) {
				setEmail(initialEmail);
			}
			resetMessagesAndStep();
		}
	}, [isForgotPassword, initialEmail]);

	useEffect(() => {
		// TH1: Khi ở trạng thái rảnh (idle) -> Xoay vòng đổi câu thoại mỗi 10 giây
		if (feedback.type === 'idle') {
			const interval = setInterval(() => {
				setFeedback((prev) => {
					const otherMessages = IDLE_MESSAGES.filter((m) => m !== prev.text);
					const randomText = otherMessages[Math.floor(Math.random() * otherMessages.length)];

					return { type: 'idle', text: randomText };
				});
			}, 10000);

			return () => clearInterval(interval);
		}

		// TH2: Khi có thông báo Lỗi hoặc Thành công -> Chờ 5s rồi reset về idle
		const timeout = setTimeout(() => {
			setFeedback({
				type: 'idle',
				text: IDLE_MESSAGES[0],
			});
		}, 5000);

		return () => clearTimeout(timeout);
	}, [feedback.type]);

	// Hàm hỗ trợ gửi thông báo
	const notify = (type: 'error' | 'success', text: string) => {
		setFeedback({ type, text });
	};

	const resetMessagesAndStep = () => {
		setStep('form');
		setOtp('');
		setFeedback({
			type: 'idle',
			text: mode === 'login' ? 'Nhập thông tin đăng nhập nhé!' : 'Điền thông tin để tiếp tục nhé!',
		});
	};

	// Validate mật khẩu ở frontend
	const validatePassword = (pwd: string) => {
		if (pwd.length < 8) return false;
		if (/^\d+$/.test(pwd)) return false;
		if (/^[a-zA-Z]+$/.test(pwd)) return false;
		return true;
	};

	// Validate tên
	const validateFullName = (name: string) => {
		const regex = /^[\p{L}\s]+$/u;
		return regex.test(name.trim());
	};

	// Validate email ở frontend
	const validateEmail = (email: string) => {
		const cleanEmail = email.trim();

		if (!cleanEmail) return false;

		const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
		if (!emailRegex.test(cleanEmail)) return false;

		return true;
	};

	// Đăng nhập
	const handleLogin = async (e: React.SyntheticEvent) => {
		e.preventDefault();

		if (!email) {
			notify('error', 'Bạn quên điền email kìa..');
			return;
		}

		if (!password) {
			notify('error', 'Bạn không định điền mật khẩu hả..');
			return;
		}

		setLoading(true);
		try {
			const formData = new URLSearchParams();
			formData.append('username', email);
			formData.append('password', password);

			const response = await api.post('/auth/login', formData, {
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			});

			localStorage.setItem('access_token', response.data.access_token);
			notify('success', 'Đăng nhập thành công!');
			setTimeout(() => router.push('/'), 1000);
		} catch (err: any) {
			notify('error', err.response?.data?.detail || 'Email hoặc mật khẩu không chính xác...');
		} finally {
			setLoading(false);
		}
	};

	// Gửi OTP Register
	const handleSendRegisterOTP = async (e: React.SyntheticEvent) => {
		e.preventDefault();

		if (!fullName.trim()) {
			notify('error', 'Bạn quên điền tên kìa..');
			return;
		}

		if (!validateFullName(fullName)) {
			notify('error', 'Họ và tên không được chứa số hoặc ký tự đặc biệt..');
			return;
		}

		if (!email) {
			notify('error', 'Bạn quên điền email kìa..');
			return;
		}

		if (!validateEmail(email)) {
			notify('error', 'Điền lại email cho đúng đi đã...');
			return;
		}

		if (!password) {
			notify('error', 'Bạn không định điền mật khẩu hả..');
			return;
		}

		if (!validatePassword(password)) {
			notify('error', 'Mật khẩu phải từ 8 ký tự, bao gồm cả chữ và số hoặc ký tự đặc biệt...');
			return;
		}

		setLoading(true);
		try {
			await api.post('/auth/send-otp', { email, password, full_name: fullName });
			setStep('otp');
			notify('success', `Mã OTP đã được gửi tới ${email}`);
		} catch (err: any) {
			notify('error', err.response?.data?.detail || 'Không thể gửi mã OTP!');
		} finally {
			setLoading(false);
		}
	};

	// Xác thực OTP & Đăng ký
	const handleRegister = async (e: React.SyntheticEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			await api.post('/auth/register', { email, password, full_name: fullName, otp });
			notify('success', 'Đăng ký thành công! Hãy tiếp tục đăng nhập.');
			setMode('login');
			resetMessagesAndStep();
			setPassword('');
		} catch (err: any) {
			notify('error', err.response?.data?.detail || 'Xác thực OTP thất bại!');
		} finally {
			setLoading(false);
		}
	};

	// Gửi OTP Quên Mật Khẩu
	const handleSendForgotOTP = async (e: React.SyntheticEvent) => {
		e.preventDefault();

		if (!email) {
			notify('error', 'Vui lòng nhập email của bạn.');
			return;
		}

		setLoading(true);
		try {
			await api.post('/auth/forgot-password/send-otp', { email });
			setStep('otp');
			notify('success', `Mã OTP khôi phục đã được gửi tới ${email}`);
		} catch (err: any) {
			notify('error', err.response?.data?.detail || 'Không thể gửi mã OTP khôi phục!');
		} finally {
			setLoading(false);
		}
	};

	// Đổi Mật Khẩu Mới
	const handleResetPassword = async (e: React.SyntheticEvent) => {
		e.preventDefault();

		if (!validatePassword(newPassword)) {
			notify('error', 'Mật khẩu phải từ 8 ký tự, bao gồm cả chữ và số hoặc ký tự đặc biệt.');
			return;
		}

		setLoading(true);
		try {
			await api.post('/auth/forgot-password/reset', { email, otp, new_password: newPassword });
			notify('success', 'Đặt lại mật khẩu thành công! Hãy đăng nhập lại.');
			setMode('login');
			resetMessagesAndStep();
			setPassword('');
			setNewPassword('');
		} catch (err: any) {
			notify('error', err.response?.data?.detail || 'Đổi mật khẩu thất bại!');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-black p-4 text-white">
			<div className="w-full max-w-md space-y-5 rounded-3xl border border-zinc-800 bg-zinc-900/90 p-7 shadow-2xl backdrop-blur-md">

				{/* Header */}
				<div className="text-center space-y-1">
					<div className="inline-flex items-center gap-2 text-xl font-bold tracking-tight text-white">
						<span className="text-blue-500 font-extrabold text-2xl">✦</span> AmsClubHub
					</div>
					<h1 className="text-2xl font-bold tracking-tight text-white">
						{mode === 'login' && 'Đăng nhập'}
						{mode === 'register' && 'Tạo tài khoản mới'}
						{mode === 'forgot' && 'Quên mật khẩu'}
					</h1>
					<p className="text-xs text-zinc-400">
						{mode === 'login' && (
							<>
								Chưa có tài khoản?{' '}
								<button
									type="button"
									onClick={() => { setMode('register'); resetMessagesAndStep(); }}
									className="font-semibold text-blue-400 hover:text-blue-300 hover:underline transition"
								>
									Đăng ký ngay
								</button>
							</>
						)}
						{mode === 'register' && (
							<>
								Đã có tài khoản?{' '}
								<button
									type="button"
									onClick={() => { setMode('login'); resetMessagesAndStep(); }}
									className="font-semibold text-blue-400 hover:text-blue-300 hover:underline transition"
								>
									Đăng nhập
								</button>
							</>
						)}
						{mode === 'forgot' && 'Nhập email để nhận mã OTP khôi phục mật khẩu'}
					</p>
				</div>

				{/* MASCOT CHIM & BONG BÓNG THOẠI (FIXED HEIGHT CONTAINER) */}
				<div className="flex items-center gap-3 pt-1">
					{/* Ảnh chú chim */}
					<div className="relative shrink-0">
						<Image
							src={pigeonImg}
							alt="Mascot Pigeon"
							priority
							className="w-14 h-14 object-contain drop-shadow-md"
						/>
					</div>

					{/* Bong bóng thoại cố định chiều cao (min-h-[56px]) */}
					<div
						className={`relative w-fit max-w-[280px] min-w-[120px] min-h-[44px] px-4 py-2.5 rounded-2xl border text-xs font-medium flex items-center transition-all duration-300 ease-in-out ${feedback.type === 'error'
							? 'bg-red-950/40 border-red-500/40 text-red-300'
							: feedback.type === 'success'
								? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
								: 'bg-zinc-800/80 border-zinc-700/80 text-zinc-300'
							}`}
					>
						{/* Mũi tên chỉ vào con chim */}
						<div
							className={`absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0 border-y-[6px] border-y-transparent border-r-[8px] transition-all duration-300 ${feedback.type === 'error'
								? 'border-r-red-500/40'
								: feedback.type === 'success'
									? 'border-r-emerald-500/40'
									: 'border-r-zinc-700/80'
								}`}
						/>

						<p className="leading-snug break-words w-full">{feedback.text}</p>
					</div>
				</div>

				{/* FORM NHẬP THÔNG TIN */}
				{step === 'form' && (
					<form
						onSubmit={
							mode === 'login'
								? handleLogin
								: mode === 'register'
									? handleSendRegisterOTP
									: handleSendForgotOTP
						}
						className="space-y-3.5"
					>
						{mode === 'register' && (
							<div className="space-y-1">
								<label className="text-xs font-semibold text-zinc-300">Họ và tên</label>
								<Input
									type="text"
									placeholder="Nghiêm Vũ Hoàng Long"
									value={fullName}
									onChange={(e) => setFullName(e.target.value)}
									required
									className="rounded-full bg-zinc-800/80 border-zinc-700 text-white placeholder:text-zinc-500 h-10 px-4 text-sm"
								/>
							</div>
						)}

						<div className="space-y-1">
							<label className="text-xs font-semibold text-zinc-300">Email</label>
							<Input
								type="email"
								placeholder="yourname@mail.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								className="rounded-full bg-zinc-800/80 border-zinc-700 text-white placeholder:text-zinc-500 h-10 px-4 text-sm"
							/>
						</div>

						{mode !== 'forgot' && (
							<div className="space-y-1">
								<div className="flex justify-between items-center">
									<label className="text-xs font-semibold text-zinc-300">Mật khẩu</label>
									{mode === 'login' && (
										<button
											type="button"
											onClick={() => { setMode('forgot'); resetMessagesAndStep(); }}
											className="text-xs font-medium text-blue-400 hover:text-blue-300 hover:underline transition"
										>
											Quên mật khẩu?
										</button>
									)}
								</div>
								<div className="relative">
									<Input
										type={showPassword ? 'text' : 'password'}
										placeholder="••••••••"
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										required
										className="rounded-full bg-zinc-800/80 border-zinc-700 text-white placeholder:text-zinc-500 h-10 px-4 pr-10 text-sm"
									/>
									<button
										type="button"
										onClick={() => setShowPassword(!showPassword)}
										className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition"
									>
										{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
									</button>
								</div>
							</div>
						)}

						{mode === 'login' && (
							<div className="flex items-center gap-2 pt-0.5">
								<input
									type="checkbox"
									id="remember"
									checked={rememberMe}
									onChange={(e) => setRememberMe(e.target.checked)}
									className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-blue-600 focus:ring-blue-500 cursor-pointer"
								/>
								<label htmlFor="remember" className="text-xs text-zinc-400 cursor-pointer select-none">
									Ghi nhớ đăng nhập
								</label>
							</div>
						)}

						<Button
							type="submit"
							disabled={loading}
							className="w-full rounded-full bg-white hover:bg-zinc-200 text-black h-10 font-semibold transition-all shadow-md mt-1"
						>
							{loading ? (
								<Loader2 className="h-4 w-4 animate-spin text-black" />
							) : mode === 'login' ? (
								'Đăng nhập'
							) : mode === 'register' ? (
								'Nhận mã OTP đăng ký'
							) : (
								'Gửi mã OTP khôi phục'
							)}
						</Button>

						{mode === 'forgot' && (
							<button
								type="button"
								onClick={() => { setMode('login'); resetMessagesAndStep(); }}
								className="w-full text-xs text-zinc-400 hover:text-white flex items-center justify-center gap-1.5 pt-1 transition"
							>
								<ArrowLeft className="w-3.5 h-3.5" /> Quay lại đăng nhập
							</button>
						)}
					</form>
				)}

				{/* NHẬP OTP */}
				{step === 'otp' && (
					<form
						onSubmit={mode === 'register' ? handleRegister : handleResetPassword}
						className="space-y-3.5"
					>
						<div className="space-y-1">
							<label className="text-xs font-semibold text-zinc-300">Mã OTP (6 chữ số)</label>
							<Input
								type="text"
								placeholder="123456"
								value={otp}
								onChange={(e) => setOtp(e.target.value)}
								maxLength={6}
								required
								className="rounded-full bg-zinc-800/80 border-zinc-700 text-white placeholder:text-zinc-600 text-center tracking-widest text-lg h-11 font-bold"
							/>
						</div>

						{mode === 'forgot' && (
							<div className="space-y-1">
								<label className="text-xs font-semibold text-zinc-300">Mật khẩu mới</label>
								<div className="relative">
									<Input
										type={showPassword ? 'text' : 'password'}
										placeholder="••••••••"
										value={newPassword}
										onChange={(e) => setNewPassword(e.target.value)}
										required
										className="rounded-full bg-zinc-800/80 border-zinc-700 text-white placeholder:text-zinc-500 h-10 px-4 pr-10 text-sm"
									/>
									<button
										type="button"
										onClick={() => setShowPassword(!showPassword)}
										className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition"
									>
										{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
									</button>
								</div>
							</div>
						)}

						<Button
							type="submit"
							disabled={loading}
							className="w-full rounded-full bg-white hover:bg-zinc-200 text-black h-10 font-semibold transition-all shadow-md"
						>
							{loading ? (
								<Loader2 className="h-4 w-4 animate-spin text-black" />
							) : mode === 'register' ? (
								'Xác nhận đăng ký'
							) : (
								'Xác nhận đổi mật khẩu'
							)}
						</Button>

						<button
							type="button"
							onClick={() => { setStep('form'); }}
							className="w-full text-xs text-zinc-400 hover:text-white flex items-center justify-center gap-1.5 pt-1 transition"
						>
							<ArrowLeft className="w-3.5 h-3.5" /> Quay lại chỉnh sửa thông tin
						</button>
					</form>
				)}
			</div>
		</div>
	);
}