'use client';

import { Post } from '@/types/club';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';
import { getFullImageUrl } from '@/lib/utils';

interface PostCardProps {
	post: Post;
	canEditClub: boolean;
	onEdit: (post: Post) => void;
	onDelete: (postId: number | string) => void;
}

export default function PostCard({ post, canEditClub, onEdit, onDelete }: PostCardProps) {
	return (
		<Card className="bg-white mb-4 shadow-sm hover:shadow-md transition">
			<CardHeader>
				<CardTitle className="text-lg">{post.title}</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<p className="text-slate-600 whitespace-pre-line leading-relaxed">{post.content}</p>

				{/* KHUNG HIỂN THỊ ẢNH BÀI ĐĂNG (NẾU CÓ) */}
				{post.image_url && (
					<div className="overflow-hidden rounded-lg border border-slate-100 max-h-96">
						<img
							src={getFullImageUrl(post.image_url)}
							alt={post.title}
							className="w-full h-full object-cover"
						/>
					</div>
				)}

				{/* Nếu bài viết này có kèm Link Google Form ứng tuyển */}
				{post.application_form_url && (
					<div className="pt-2">
						<a
							href={post.application_form_url}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-md transition shadow-sm"
						>
							<span>Điền đơn đăng ký / Ứng tuyển</span>
							<ExternalLink className="h-3.5 w-3.5" />
						</a>
					</div>
				)}
			</CardContent>

			{/* Thanh công cụ sửa & xóa dành cho Admin */}
			{canEditClub && (
				<CardFooter className="flex justify-end gap-2 border-t pt-3 pb-3 bg-slate-50/50">
					<button
						type="button"
						onClick={() => onEdit(post)}
						className="px-3 py-1.5 text-xs font-medium bg-amber-50 text-amber-700 rounded-md border border-amber-200 hover:bg-amber-100 transition flex items-center gap-1 cursor-pointer"
					>
						✏️ Chỉnh sửa
					</button>

					<button
						type="button"
						onClick={() => onDelete(post.id)}
						className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 rounded-md border border-red-200 hover:bg-red-100 transition flex items-center gap-1 cursor-pointer"
					>
						🗑️ Xóa bài
					</button>
				</CardFooter>
			)}
		</Card>
	);
}