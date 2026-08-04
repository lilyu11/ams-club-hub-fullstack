'use client';

import { Card } from '@/components/ui/card';
import { Users } from 'lucide-react';

export default function ClubFollowers() {
	return (
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
					<div className="flex items-center justify-between border-b pb-2">
						<span>Hùng Dã</span>
						<span className="text-xs text-slate-400">Vua</span>
					</div>
					<p className="text-xs text-slate-400 text-center pt-2">Và nhiều thành viên khác...</p>
				</div>
			</Card>
		</div>
	);
}