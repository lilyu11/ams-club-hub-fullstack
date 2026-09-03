'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
	BookOpen,
	PhoneCall,
	Bell,
	FingerprintPattern,
	KeyRound,
	ChevronRight,
	Search,
	Sparkles,
	Settings,
	HelpCircle,
	Info,
	Compass,
	ArrowLeft,
} from 'lucide-react';
import api from '@/lib/api';

interface GuideSection {
	title: string;
	description: React.ReactNode;
	details?: (string | React.ReactNode)[];
}

interface GuideTopic {
	id: string;
	title: string;
	description: string;
	icon: any;
	isAdminOnly?: boolean; // Nếu true thì Chỉ club_admin và super_admin mới thấy
	sections: GuideSection[];
}

// NỘI DUNG HƯỚNG DẪN
const GUIDE_TOPICS: GuideTopic[] = [
	{
		id: 'overview',
		title: 'Tổng quan hệ thống',
		description: 'Giới thiệu các tính năng cơ bản',
		icon: Sparkles,
		sections: [
			{
				title: 'AmsClubHub là gì?',
				description: 'Nền tảng kết nối và quản lý thông tin các câu lạc bộ dành cho học sinh',
				details: [
					'Theo dõi các sự kiện, tuyển thành viên mới nhất từ các câu lạc bộ',
					'Đăng ký tham gia và theo dõi các câu lạc bộ yêu thích',
					'Nhận thông báo tự động từ các câu lạc bộ đang theo dõi',
				],
			},
			{
				title: 'Tiến trình dự án',
				description: 'Hiện đang trong giai đoạn thử nghiệm',
			},
		],
	},
	{
		id: 'clubs_and_events',
		title: 'Câu lạc bộ & Sự kiện',
		description: 'Tìm kiếm và khám phá các câu lạc bộ và sự kiện',
		icon: Compass,
		sections: [
			{
				title: 'Danh sách các câu lạc bộ',
				description: 'Vào mục "Câu lạc bộ" trên thanh điều hướng bên trái',
				details: [
					'Danh sách tất cả các câu lạc bộ chính thống và dự án do học sinh Ams quản lý',
					'Tìm kiếm dựa trên từ khóa, đặc trưng, và phân loại câu lạc bộ',
					'Bấm vào các thẻ để xem chi tiết các bài đăng, sự kiện, lịch tuyển thành viên',
				],
			},
			{
				title: 'Chi tiết câu lạc bộ',
				description: 'Bấm vào các thẻ từ danh sách câu lạc bộ hoặc widget gợi ý bên thanh phải',
				details: [
					'Xem được tất cả các bài đăng mở đơn, tuyển thành viên, và sự kiện của câu lạc bộ',
					'Theo dõi để nhận được thông báo mỗi khi có sự kiện mới hoặc bài đăng tuyển thành viên',
				],
			},
			{
				title: 'Danh sách các sự kiện',
				description: 'Vào mục "Sự kiện" trên thanh điều hướng bên trái',
				details: [
					'Danh sách các sự kiện đang diễn ra, sắp diễn ra, và đã qua, được lên lịch sẵn theo tháng',
					'Tìm kiếm dựa trên từ khóa, tên sự kiện, và phân loại câu lạc bộ',
					'Bấm vào các thẻ để xem thông tin chi tiết sự kiện',
				],
			},
		],
	},
	{
		id: 'posts_and_notifications',
		title: 'Bài đăng & Thông báo',
		description: 'Các tính năng của bài đăng và thông báo',
		icon: Bell,
		sections: [
			{
				title: 'Bài đăng',
				description: 'Xem ở bảng feed, các câu lạc bộ, hoặc widget gợi ý bên thanh phải',
				details: [
					'Bấm vào các bài đăng để xem đầy đủ nội dung',
					'"Bật nhắc nhở" từ bài đăng để nhận thông báo về email trước 12h mỗi khi sự kiện hết hạn đăng ký',
					'Bấm vào "đăng ký ngay" để chuyển hướng trực tiếp tới form đăng ký',
					'Bấm vào biểu tượng chia sẻ để sao chép link bài viết',
				],
			},
			{
				title: 'Thông báo',
				description: 'Vào mục "Thông báo" trên thanh điều hướng bên trái',
				details: [
					'Nhận thông báo các bài đăng trong 21 ngày qua và nhắc nhở từ câu lạc bộ đang theo dõi',
					'Bật "tự động nhắc nhở" để luôn nhận thông báo về email trước 12h mỗi khi sự kiện hết hạn đăng ký',
					'Bấm vào biểu tượng tượng thùng rác để xóa nhắc nhở đã đặt'
				],
			},
		],
	},
	{
		id: 'profile_and_settings',
		title: 'Hồ sơ & Cài đặt',
		description: 'Quản lý tài khoản người dùng và giao diện',
		icon: Settings,
		sections: [
			{
				title: 'Thông tin tài khoản',
				description: 'Vào mục "Hồ sơ" trên thanh điều hướng bên trái, hoặc xem bản ngắn gọn trên widget bên phải',
				details: [
					'Xem các thông tin chi tiết như tên tài khoản, mã tài khoản, quyền hạn,...',
					'Đổi mật khẩu, đăng xuất, đăng nhập',
				],
			},
			{
				title: 'Cài đặt',
				description: 'Vào mục "Cài đặt" trên thanh điều hướng bên trái',
				details: [
					'Tùy chỉnh giao diện sáng tối',
				],
			},
		],
	},
	{
		id: 'terms_of_service_and_privacy_policy',
		title: 'Điều khoản & Bảo mật',
		description: 'Điều khoản dịch vụ, Quyền riêng tư',
		icon: KeyRound,
		sections: [
			{
				title: 'Điều khoản dịch vụ',
				description: <Link href="/terms">Bấm vào đây để xem <strong>điều khoản dịch vụ</strong></Link>
				,
			},
			{
				title: 'Quyền riêng tư',
				description: <Link href="/privacy">Bấm vào đây để xem <strong>quyền riêng tư</strong></Link>
			},
		],
	},
	{
		id: 'contact_and_feedback',
		title: 'Liên hệ & Feedback',
		description: 'Liên hệ admin, gửi feedback',
		icon: PhoneCall,
		sections: [
			{
				title: 'Thông tin liên hệ',
				description: <Link href="/project-info">Bấm vào đây để xem <strong>thông tin liên hệ</strong></Link>,
			},
			{
				title: 'Feedback',
				description: <Link href="https://forms.gle/TR5ihBU7ZT7j4oVH9">Bấm vào đây để tới trang <strong>feedback</strong></Link>,
			},
		],
	},

	// CÁC MỤC CHỈ DÀNH CHO ADMIN (isAdminOnly: true)
	{
		id: 'club_management',
		title: 'Quản lý câu lạc bộ',
		description: 'Các tính năng quản lý và chỉnh sửa câu lạc bộ',
		icon: FingerprintPattern,
		isAdminOnly: true,
		sections: [
			{
				title: 'Quyền hạn và bảo mật',
				description: 'Chi tiết về quyền hạn và bảo mật cho các câu lạc bộ',
				details: [
					'Mỗi câu lạc bộ sẽ chỉ có duy nhất một tài khoản quản lý câu lạc bộ đó, và tài khoản của admin câu lạc bộ sẽ được quản lý bởi admin của website',
					'Mỗi tài khoản admin câu lạc bộ chỉ có thể quản lý và chỉnh sửa được nội dung của câu lạc bộ đó, không thể chỉnh sửa bất kì câu lạc bộ nào khác',
					'Các tài khoản không phải admin câu lạc bộ đó sẽ không thấy những tính năng chỉnh sửa và quản lý bài đăng, sự kiện, và profile của câu lạc bộ đó'
				],
			},
			{
				title: 'Chỉnh sửa profile câu lạc bộ',
				description: 'Vào mục "Chỉnh sửa" trong trang chủ của câu lạc bộ',
				details: [
					'Avatar và cover',
					'Tên câu lạc bộ, mô tả ngắn gọn, email liên hệ, và fanpage facebook chính thống',
					'Các tag lĩnh vực, đặc trưng, và mã câu lạc bộ sẽ hiện lên khi người dùng tìm kiếm hoặc xem trên mục khám phá câu lạc bộ',
				],
			},
		],
	},
	{
		id: 'post_management',
		title: 'Quản lý bài đăng và sự kiện',
		description: 'Các tính năng quản lý và chỉnh sửa bài viết, sự kiện',
		icon: BookOpen,
		isAdminOnly: true,
		sections: [
			{
				title: 'Tạo và quản lý bài đăng',
				description: 'Vào mục "Thêm bài viết" trong trang chủ của câu lạc bộ',
				details: [
					'Deadline phải được cung cấp trong bài viết để người dùng có thể nhận thông báo trực tiếp về email trước deadline 12 tiếng',
					'"Link đăng ký" có thể là link trực tiếp tới form đăng ký, hoặc tới bài viết gốc trên Facebook (khuyên dùng)',
					'Link sao chép ở bài viết sẽ là link liên kết tới bài viết trên website, không phải tới link đăng ký được cung cấp trong bài viết',
				]
			},
			{
				title: 'Tạo và duyệt sự kiện',
				description: 'Vào mục "Thêm bài viết" trong trang chủ của câu lạc bộ',
				details: [
					'Sự kiện sẽ được hiện lên trong mục "Sự kiện" và sắp xếp vào mục đang diễn ra, sắp diễn ra, hoặc đã diễn ra dựa theo tháng và khoảng thời gian hoạt động ghi trong sự kiện',
					'Các tính năng bổ sung hoặc chỉnh sửa đối với sự kiện sẽ được thêm vào giai đoạn sau thử nghiệm hiện tại'
				]
			},
		],
	},
];

export default function GuidesPage() {
	const [userRole, setUserRole] = useState<string>('student');
	const [activeTopicId, setActiveTopicId] = useState<string>('overview');
	const [searchQuery, setSearchQuery] = useState<string>('');
	const [loading, setLoading] = useState<boolean>(true);
	const [showDetailMobile, setShowDetailMobile] = useState<boolean>(false);

	// Lấy thông tin user hiện tại từ Backend
	useEffect(() => {
		const token = localStorage.getItem('access_token');
		if (!token) return;

		const fetchCurrentUser = async () => {
			try {
				const res = await api.get('/users/me');
				if (res.data?.role) {
					setUserRole(res.data.role.toLowerCase());
				}
			} catch (err) {
				console.error('Không thể xác thực vai trò người dùng:', err);
			} finally {
				setLoading(false);
			}
		};

		fetchCurrentUser();
	}, []);

	// Kiểm tra quyền Admin
	const isAdmin = userRole === 'club_admin' || userRole === 'super_admin';

	// Lọc danh sách chủ đề dựa trên Role & từ khóa tìm kiếm
	const visibleTopics = GUIDE_TOPICS.filter((topic) => {
		const matchesRole = !topic.isAdminOnly || isAdmin;
		const matchesSearch =
			topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			topic.description.toLowerCase().includes(searchQuery.toLowerCase());
		return matchesRole && matchesSearch;
	});

	// Chủ đề đang được chọn hiện tại
	const activeTopic =
		visibleTopics.find((t) => t.id === activeTopicId) || visibleTopics[0] || GUIDE_TOPICS[0];

	const handleSelectTopic = (id: string) => {
		setActiveTopicId(id);
		setShowDetailMobile(true);
	};

	return (
		<div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
			{/* DANH SÁCH MỤC (BÊN TRÁI) */}
			<div className={`w-full sm:w-[320px] md:w-[380px] shrink-0 border-r border-border flex-col h-full bg-background/50 ${showDetailMobile ? 'hidden sm:flex' : 'flex'}`}>
				{/* Header Cột 2 */}
				<div className="p-4 border-b border-border space-y-3">
					<h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
						<HelpCircle className="w-5 h-5 text-primary" />
						Hướng dẫn
					</h1>

					{/* Thanh tìm kiếm chủ đề */}
					<div className="relative">
						<Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
						<input
							type="text"
							placeholder="Tìm kiếm hướng dẫn..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full pl-9 pr-4 py-2 bg-muted/50 border border-border rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-primary transition"
						/>
					</div>
				</div>

				{/* Danh sách các mục */}
				<div className="flex-1 overflow-y-auto divide-y divide-border/40">
					{visibleTopics.map((topic) => {
						const Icon = topic.icon;
						const isSelected = activeTopic?.id === topic.id;

						return (
							<button
								key={topic.id}
								onClick={() => handleSelectTopic(topic.id)}
								className={`w-full text-left p-4 flex items-center justify-between transition-colors relative ${isSelected
									? 'bg-muted/70 font-semibold'
									: 'hover:bg-muted/30 text-muted-foreground hover:text-foreground'
									}`}
							>
								<div className="flex items-start gap-3 min-w-0 pr-2">
									<Icon
										className={`w-5 h-5 shrink-0 mt-0.5 ${isSelected ? 'text-primary' : 'text-muted-foreground'
											}`}
									/>
									<div className="min-w-0">
										<div className="flex items-center gap-1.5">
											<p className="text-sm font-medium text-foreground truncate">
												{topic.title}
											</p>
											{topic.isAdminOnly && (
												<span className="shrink-0 px-1.5 py-0.2 text-[9px] font-semibold bg-amber-500/15 text-amber-500 rounded border border-amber-500/30">
													ADMIN
												</span>
											)}
										</div>
										<p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
											{topic.description}
										</p>
									</div>
								</div>

								<ChevronRight
									className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? 'text-primary translate-x-0.5' : 'text-muted-foreground/40'
										}`}
								/>

								{/* Vạch màu xanh báo chọn bên mép phải chuẩn X style */}
								{isSelected && (
									<div className="absolute right-0 top-0 bottom-0 w-1 bg-primary rounded-l" />
								)}
							</button>
						);
					})}

					{visibleTopics.length === 0 && (
						<div className="p-8 text-center text-sm text-muted-foreground">
							Không tìm thấy mục hướng dẫn phù hợp.
						</div>
					)}
				</div>
			</div>

			{/* NỘI DUNG CHI TIẾT (BÊN PHẢI) */}
			<div className={`flex-1 h-full overflow-y-auto bg-background ${showDetailMobile ? 'block' : 'hidden sm:block'}`}>
				{activeTopic ? (
					<div className="max-w-3xl p-6 md:p-10 space-y-8">
						{/* Nút quay lại trên Mobile */}
						<button
							onClick={() => setShowDetailMobile(false)}
							className="sm:hidden inline-flex p-2 rounded-full bg-white dark:bg-neutral-900/80 text-zinc-800 dark:text-white hover:bg-zinc-100 dark:hover:bg-neutral-800 transition-all border border-zinc-200 dark:border-neutral-800 shadow-sm"
						>
							<ArrowLeft className="w-4 h-4" />
							{/* Quay lại danh sách */}
						</button>

						{/* Title phần chi tiết */}
						<div className="pb-6 border-b border-border">
							<div className="flex items-center gap-2 text-primary font-medium text-sm mb-1">
								{activeTopic.isAdminOnly ? 'Admin' : 'Chi tiết'}
							</div>
							<h2 className="text-2xl font-bold tracking-tight">{activeTopic.title}</h2>
							<p className="text-muted-foreground text-sm mt-1">{activeTopic.description}</p>
						</div>

						{/* Danh sách các khối nội dung chi tiết */}
						<div className="space-y-6">
							{activeTopic.sections.map((section, idx) => (
								<div
									key={idx}
									className="p-5 rounded-2xl border border-border/80 bg-card/40 hover:bg-card/80 transition space-y-3"
								>
									<h3 className="text-base font-semibold text-foreground flex items-center gap-2">
										<Info className="w-4 h-4 text-primary shrink-0" />
										{section.title}
									</h3>
									<p className="text-sm text-muted-foreground leading-relaxed">
										{section.description}
									</p>

									{/* Các bước hướng dẫn từng dòng */}
									{section.details && section.details.length > 0 && (
										<ul className="mt-3 space-y-2 pt-2 border-t border-border/40 text-xs text-muted-foreground">
											{section.details.map((detail, dIdx) => (
												<li key={dIdx} className="flex items-start gap-2">
													<span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
													<span>{detail}</span>
												</li>
											))}
										</ul>
									)}
								</div>
							))}
						</div>
					</div>
				) : (
					<div className="h-full flex items-center justify-center text-muted-foreground text-sm">
						Chọn một mục bên trái để xem nội dung hướng dẫn
					</div>
				)}
			</div>
		</div>
	);
}