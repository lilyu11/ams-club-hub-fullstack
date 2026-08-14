'use client';

import { PostData } from '@/types/club';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import ImageUpload from '@/components/ui/ImageUpload';

interface PostModalProps {
	isOpen: boolean;
	onClose: () => void;
	editingPost: PostData | null;
	postTitle: string;
	setPostTitle: (val: string) => void;
	postContent: string;
	setPostContent: (val: string) => void;
	postFormUrl: string;
	setPostFormUrl: (val: string) => void;
	postImageUrl: string;
	setPostImageUrl: (val: string) => void;
	postDeadline: string;
    setPostDeadline: (val: string) => void;
	submitting: boolean;
	onSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
	triggerToast?: (message: string, type?: 'success' | 'error') => void;
}

export default function PostModal({
	isOpen,
	onClose,
	editingPost,
	postTitle,
	setPostTitle,
	postContent,
	setPostContent,
	postFormUrl,
	setPostFormUrl,
	postImageUrl,
	setPostImageUrl,
	postDeadline,
    setPostDeadline,
	submitting,
	onSubmit,
	triggerToast,
}: PostModalProps) {
	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="bg-background dark:bg-zinc-900 text-foreground dark:text-zinc-100 border-border dark:border-zinc-800">
				<DialogHeader>
					<DialogTitle>
						{editingPost ? 'Chỉnh sửa bài đăng' : 'Tạo bài đăng'}
					</DialogTitle>
				</DialogHeader>
				<form onSubmit={onSubmit} className="space-y-4 mt-2">
					<div className="space-y-2">
						<label className="text-xs font-medium text-zinc-400">Tiêu đề bài viết</label>
						<Input
							placeholder="Ví dụ: [Tuyển thành viên 2026] Mở đơn đăng ký đợt 1"
							value={postTitle}
							onChange={(e) => setPostTitle(e.target.value)}
							required
						/>
					</div>

					<div className="space-y-2">
						<label className="text-xs font-medium text-zinc-400">Link Google Form / Link ứng tuyển (Không bắt buộc)</label>
						<Input
							placeholder="https://forms.gle/..."
							value={postFormUrl}
							onChange={(e) => setPostFormUrl(e.target.value)}
						/>
					</div>

					<div className="space-y-2">
                        <label className="text-xs font-medium text-zinc-400">
                            Hạn chót / Deadline bài viết (Dùng để gửi email nhắc nhở)
                        </label>
                        <Input
                            type="datetime-local"
                            value={postDeadline}
                            onChange={(e) => setPostDeadline(e.target.value)}
							onKeyDown={(e) => e.preventDefault()}
							onClick={(e) => e.currentTarget.showPicker?.()}
                            className="cursor-pointer select-none"
                        />
                    </div>

					<div className="space-y-2">
						<label className="text-xs font-medium text-zinc-400">Nội dung chi tiết</label>
						<Textarea
							placeholder="Nhập yêu cầu, mô tả sự kiện..."
							rows={5}
							value={postContent}
							onChange={(e) => setPostContent(e.target.value)}
							required
							className="resize-none h-40 overflow-y-auto"
						/>
					</div>

					<div>
			<label className="text-xs font-medium text-zinc-400">
			  Ảnh đính kèm bài viết (Tùy chọn)
			</label>
			<ImageUpload
			  value={postImageUrl}
			  onChange={setPostImageUrl}
			  aspectRatio="post"
							uploadEndpoint="/upload/image"
			/>
		  </div>

					<DialogFooter>
						<Button type="button" variant="outline" onClick={onClose}>
							Hủy
						</Button>
						<Button type="submit" disabled={submitting}>
							{submitting ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang xử lý...
								</>
							) : editingPost ? (
								'Cập nhật'
							) : (
								'Đăng bài'
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}