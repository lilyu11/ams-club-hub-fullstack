import Link from 'next/navigation'

export default function InfoPage() {
	const sections = [
		{
			id: 'sec-1',
			title: '1. Giới thiệu về dự án',
			content: (
				<p>
					<strong>Ams Club Hub</strong> là dự án cá nhân được thành lập và phát triển bởi học sinh trường THPT Chuyên Hà Nội - Amsterdam
					với mục đích giải quyết vấn đề về tổng hợp và quản lý thông tin truyền thông các câu lạc bộ (CLB) trong trường, dành cho các bạn học sinh có hứng thú
					với việc tham gia và tìm hiểu các CLB. Giúp việc tham gia và quảng bá các sự kiện bao gồm tuyển thành viên, mở bán ấn phẩm, mở bán vé,... được dễ dàng,
					đạt hiệu quả cao hơn. Qua đó lan tỏa truyền thống tham gia hoạt động ngoại khóa của trường cũng như là bản sắc của các CLB tới nhiều người hơn, đặc biệt
					là tới những bạn trẻ có mong muốn tham gia trải nghiệm, phát triển bản thân trong môi trường THPT.
				</p>
			),
		},
		{
			id: 'sec-2',
			title: '2. Thông tin liên hệ',
			content: (
				<div className="space-y-3">
					<p>Nếu bạn có nhu cầu công việc hoặc các vấn đề liên quan tới dự án, vui lòng liên hệ qua:</p>
					<ul className="list-disc pl-5 space-y-2">
						<li>
							<strong>Email:</strong> {' '}
							<a
								href="mailto:amsclubhub@gmail.com"
								className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
							>
								amsclubhub@gmail.com
							</a>
						</li>
						<li>
							<strong>Facebook:</strong> {' '}
							<a
								href="https://www.facebook.com/amsclubhub/"
								className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
							>
								https://www.facebook.com/amsclubhub/
							</a>
						</li>
						<li>
							<strong>Số điện thoại (Founder):</strong> 0973848793 (Hà Dũng)
						</li>

					</ul>
				</div>
			),
		},
	];
	return (
		<div className="lg:col-span-8 space-y-10">
			<header className="border-b border-zinc-200 pb-6 space-y-2">
				<h1 className="text-3xl font-extrabold text-zinc-900">Thông tin dự án</h1>
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
	)
}