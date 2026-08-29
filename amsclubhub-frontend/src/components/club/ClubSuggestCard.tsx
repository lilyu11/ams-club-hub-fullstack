import Link from 'next/link';

export default function ClubSuggestCard({ club }: { club: any }) {
	return (
		<div className="group w-full bg-white rounded-2xl border border-slate-200/70 overflow-hidden shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200">
			{/* Banner 3:1 */}
			<div className="relative w-full aspect-[3/1] bg-slate-100 overflow-hidden">
				<img
					src={club?.banner_url || '/static/images/default-banner.png'}
					alt={club?.name}
					className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
				/>
			</div>

			{/* Thông tin & Logo đè */}
			<div className="relative px-4 pb-4">
				{/* Logo góc trái nhô lên Banner */}
				<div className="flex justify-between items-end -mt-7 mb-2.5">
					<div className="h-14 w-14 rounded-full border-2 border-white bg-white shadow-sm overflow-hidden shrink-0">
						<img
							src={club?.logo_url || '/static/images/default-logo.png'}
							alt={club?.name}
							className="h-full w-full object-cover"
						/>
					</div>
					{club?.code && (
						<span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500">
							#{club.code}
						</span>
					)}
				</div>

				<h3 className="font-bold text-slate-900 text-sm line-clamp-1 group-hover:text-indigo-600 transition-colors">
					{club?.name}
				</h3>
				<p className="text-xs text-slate-500 mt-1">
					{club?.category || 'Chưa phân loại'}
				</p>

				<Link href={`/clubs/${club?.id}/`} className="block mt-3">
					<button className="w-full py-2 text-xs font-semibold rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all">
						Xem trang CLB
					</button>
				</Link>
			</div>
		</div>
	);
}