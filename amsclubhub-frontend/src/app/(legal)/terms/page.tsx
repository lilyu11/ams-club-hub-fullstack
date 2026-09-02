export default function TermsPage() {
	const sections = [
		{
			id: 'sec-1',
			title: '1. Giới thiệu về nền tảng',
			content: (
				<p>
					<strong>Ams Club Hub</strong> là giải pháp công nghệ phi lợi nhuận do học sinh tự vận hành, được phát triển
					nhằm mục đích kết nối, tổng hợp và chia sẻ thông tin về các câu lạc bộ (CLB) trong trường học. Nền tảng hoạt
					động độc lập và không đại diện cho quyết định hành chính chính thức từ Ban Giám hiệu nhà trường, Đoàn trường, 
					hay bất kì Ban quản lý nào trực thuộc nhà trường.
				</p>
			),
		},
		{
			id: 'sec-2',
			title: '2. Tài khoản & Phân quyền người dùng',
			content: (
				<div className="space-y-3">
					<p>Dịch vụ của chúng tôi cung cấp các vai trò sử dụng với phạm vi quyền hạn cụ thể:</p>
					<ul className="list-disc pl-5 space-y-2">
						<li>
							<strong>Tài khoản Học sinh:</strong> Được đăng ký tự do bằng email cá nhân. Học sinh có
							trách nhiệm bảo mật thông tin đăng nhập. Được quyền tìm kiếm, xem nội dung và theo dõi các
							CLB để nhận thông báo qua website/email. Tài khoản này không có quyền đăng tải bài viết, tạo
							sự kiện, hay chỉnh sửa bất kì thông tin gì của các CLB.
						</li>
						<li>
							<strong>Tài khoản Ban quản trị CLB:</strong> Là tài khoản được Ban quản trị nền tảng cấp quyền cho
							đại diện của từng CLB để tạo, chỉnh sửa, gỡ bỏ bài viết, thông báo tuyển thành viên và sự kiện
							thuộc phạm vi CLB mình quản lý. Tài khoản còn có quyền chỉnh sửa và thay đổi thông tin của CLB 
							mình quản lý hiện trên trang chủ hoặc hồ sơ CLB.
						</li>
					</ul>
				</div>
			),
		},
		{
			id: 'sec-3',
			title: '3. Quy định về nội dung và hành vi',
			content: (
				<div className="space-y-2">
					<p>Nhằm xây dựng môi trường học đường văn minh, lành mạnh, người dùng cam kết:</p>
					<ul className="list-disc pl-5 space-y-1">
						<li>Nội dung bài đăng do Ban quản trịCLB đăng tải phải đảm bảo tính trung thực và văn hóa ứng xử.</li>
						<li>Tuyệt đối không đăng tải thông tin sai sự thật, lăng mạ, quấy rối hoặc bôi nhọ danh dự bất kì cá nhân/CLB nào.</li>
						<li>Cấm các nội dung đồi trụy, bạo lực, ngôn từ thù hận, chính trị hoặc quảng cáo thương mại ngoài CLB.</li>
						<li>Nghiêm cấm giả mạo Ban Quản trị, giả mạo CLB khác hoặc dùng công cụ tự động (bot) can thiệp hệ thống.</li>
					</ul>
				</div>
			),
		},
		{
			id: 'sec-4',
			title: '4. Quyền hạn của Ban quản trị nền tảng',
			content: (
				<ul className="list-disc pl-5 space-y-1">
					<li>Gỡ bỏ ngay lập tức bất kỳ nội dung nào vi phạm quy định mà không cần báo trước.</li>
					<li>Tạm khóa hoặc xóa vĩnh viễn tài khoản cố tình vi phạm nhiều lần.</li>
					<li>Thu hồi quyền Quản trị viên nếu phát hiện có hành vi vi phạm hoặc chuyển giao tài khoản sai quy định.</li>
				</ul>
			),
		},
		{
			id: 'sec-5',
			title: '5. Miễn trừ trách nhiệm (Disclaimer)',
			content: (
				<p>
					Ams Club Hub là nền tảng kết nối trung gian. Thông tin được cung cấp do chính các CLB tự đăng tải và chịu trách
					nhiệm. Chúng tôi không chịu trách nhiệm đối với việc sự kiện hay lịch trình bị thay đổi lịch trình hoặc hủy bỏ từ phía CLB.
					Ngoài ra, hệ thống không chịu trách nhiệm đối với các gián đoạn dịch vụ ngoài tầm kiểm soát do sự cố hạ tầng
					mạng.
				</p>
			),
		},
		{
			id: 'sec-6',
			title: '6. Quyền sở hữu trí tuệ',
			content: (
				<p>
					Mã nguồn, giao diện và thương hiệu Ams Club Hub thuộc sở hữu của đội ngũ phát triển hệ thống. Hình ảnh, logo
					và bài viết thuộc sở hữu của từng CLB tương ứng, nhưng CLB cấp quyền cho nền tảng hiển thị các tài nguyên này
					cho mục đích truyền thông.
				</p>
			),
		},
	];

	return (
		<div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
			{/* Sticky Sidebar */}
			<aside className="lg:col-span-4">
				<div className="lg:sticky lg:top-24 space-y-3">
					<h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Mục lục</h3>
					<nav className="space-y-1">
						{sections.map((s) => (
							<a
								key={s.id}
								href={`#${s.id}`}
								className="block py-1.5 px-3 text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-all border-l-2 border-transparent hover:border-zinc-900"
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
					<h1 className="text-3xl font-extrabold text-zinc-900">Điều khoản dịch vụ</h1>
					<p className="text-xs font-semibold text-zinc-500">Cập nhật lần cuối: Ngày 02 tháng 09 năm 2026</p>
					<p className="text-sm text-zinc-700 pt-2">
						Chào mừng bạn đến với Ams Club Hub. Bằng việc đăng ký hoặc sử dụng dịch vụ, bạn đồng ý tuân thủ toàn bộ các
						quy định dưới đây.
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