export default function PrivacyPage() {
	const sections = [
		{
			id: 'sec-1',
			title: 'Phần 1: Thông tin chúng tôi thu thập',
			content: (
				<ul className="list-disc pl-5 space-y-1">
					<li>
						<strong>Thông tin tài khoản:</strong> Email cá nhân (dùng xác thực OTP và nhận thông báo) và Mật khẩu (đã
						mã hóa một chiều, hệ thống không lưu mật khẩu thô).
					</li>
					<li>
						<strong>Thông tin hoạt động:</strong> Danh sách CLB bạn chọn theo dõi (Follow) và tương tác giao diện.
					</li>
					<li>
						<strong>Nhật ký kỹ thuật (Audit Logs):</strong> Địa chỉ IP, trình duyệt (User-Agent), thời gian truy cập và
						thao tác quan trọng nhằm mục đích bảo mật.
					</li>
				</ul>
			),
		},
		{
			id: 'sec-2',
			title: 'Phần 2: Mục đích Sử dụng Thông tin',
			content: (
				<p>
					Dữ liệu chỉ được dùng để xác thực tài khoản qua OTP, gửi thông báo tự động từ CLB bạn đã đăng ký Follow, và
					giám sát nhật ký hệ thống để phát hiện/ngăn chặn các đòn tấn công mạng hoặc gian lận.
				</p>
			),
		},
		{
			id: 'sec-3',
			title: 'Phần 3: Lưu trữ & Bảo mật Hạ tầng',
			content: (
				<div className="space-y-2">
					<p>Chúng tôi áp dụng tiêu chuẩn bảo mật nghiêm ngặt:</p>
					<ul className="list-disc pl-5 space-y-1">
						<li>
							<strong>Mã hóa dữ liệu:</strong> Mật khẩu băm một chiều, mã OTP tạm thời lưu trên bộ nhớ ngắn hạn và tự
							xóa sau vài phút.
						</li>
						<li>
							<strong>Bảo vệ tệp tin:</strong> Hình ảnh, tài liệu truyền thông lưu trữ trên đám mây chuyên dụng với
							chính sách phân quyền theo cấp tài khoản (Row Level Security).
						</li>
						<li>
							<strong>Mã hóa đường truyền:</strong> Toàn bộ dữ liệu kết nối giữa thiết bị của bạn và máy chủ đều qua
							giao thức HTTPS/TLS mã hóa an toàn.
						</li>
						<li>
							<strong>Không chia sẻ thương mại:</strong> Cam kết không bán hoặc chia sẻ thông tin học sinh cho bất kỳ
							bên thứ ba nào.
						</li>
					</ul>
				</div>
			),
		},
		{
			id: 'sec-4',
			title: 'Phần 4: Quyền hạn Người dùng',
			content: (
				<p>
					Bạn có quyền nhấn bỏ theo dõi (Unfollow) bất kỳ CLB nào để ngừng nhận thông báo, hoặc gửi yêu cầu cho Ban
					Quản trị để cập nhật thông tin/xóa vĩnh viễn tài khoản cá nhân khỏi hệ thống.
				</p>
			),
		},
		{
			id: 'sec-5',
			title: 'Phần 5: Lưu trữ Cục bộ (Session)',
			content: (
				<p>
					Nền tảng sử dụng Local Storage / Session Storage trên trình duyệt để duy trì trạng thái đăng nhập cá nhân và
					không sử dụng cookie theo dõi ngoài phạm vi ứng dụng.
				</p>
			),
		},
	];

	return (
		<div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
			{/* Sticky Sidebar */}
			<aside className="lg:col-span-4">
				<div className="lg:sticky lg:top-24 space-y-3">
					<h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Mục lục văn bản</h3>
					<nav className="space-y-1">
						{sections.map((s) => (
							<a
								key={s.id}
								href={`#${s.id}`}
								className="block py-1.5 px-3 text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-all border-l-2 border-transparent hover:border-zinc-900"
							>
								{s.title}
							</a>
						))}
					</nav>
				</div>
			</aside>

			{/* Main Content */}
			<div className="lg:col-span-8 space-y-10">
				<header className="border-b border-zinc-200 pb-6 space-y-2">
					<h1 className="text-3xl font-extrabold text-zinc-900">Chính sách Bảo mật</h1>
					<p className="text-xs font-semibold text-zinc-500">Cập nhật lần cuối: Ngày 02 tháng 09 năm 2026</p>
					<p className="text-sm text-zinc-700 pt-2">
						AMS Club Hub cam kết bảo vệ tối đa quyền riêng tư và an toàn thông tin cá nhân của học sinh.
					</p>
				</header>

				<div className="space-y-10">
					{sections.map((s) => (
						<section key={s.id} id={s.id} className="scroll-mt-24 space-y-3">
							<h2 className="text-lg font-bold text-zinc-900 border-b border-zinc-100 pb-1.5">{s.title}</h2>
							<div className="text-sm text-zinc-700 leading-relaxed">{s.content}</div>
						</section>
					))}
				</div>
			</div>
		</div>
	);
}