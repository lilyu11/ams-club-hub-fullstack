'use client';

import { useState, useEffect } from 'react';
import { PostData } from '@/types/club';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, FileText, Calendar } from 'lucide-react';
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
	postType: 'POST' | 'EVENT';
	setPostType: (val: 'POST' | 'EVENT') => void;
	eventDuration: string;
	setEventDuration: (val: string) => void;
	submitting: boolean;
	onSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
	showToast?: (message: string, type?: 'success' | 'error') => void;
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
	postType,
	setPostType,
	eventDuration,
	setEventDuration,
	submitting,
	onSubmit,
}: PostModalProps) {
	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="bg-background dark:bg-zinc-900 text-foreground dark:text-zinc-100 border-border dark:border-zinc-800 max-w-lg">
				<DialogHeader>
					<DialogTitle>
						{editingPost
							? postType === 'EVENT' ? 'Chỉnh sửa sự kiện' : 'Chỉnh sửa bài đăng'
							: 'Tạo bài viết / Sự kiện mới'}
					</DialogTitle>
				</DialogHeader>

				{/* CHỌN BÀI ĐĂNG HOẶC SỰ KIỆN */}
				{!editingPost && (
					<div className="grid grid-cols-2 gap-3 p-1 bg-muted rounded-xl">
						<button
							type="button"
							onClick={() => setPostType('POST')}
							className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition ${
								postType === 'POST'
									? 'bg-background text-foreground shadow-sm'
									: 'text-muted-foreground hover:text-foreground'
							}`}
						>
							<FileText className="w-4 h-4" /> Bài đăng
						</button>
						<button
							type="button"
							onClick={() => setPostType('EVENT')}
							className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition ${
								postType === 'EVENT'
									? 'bg-primary text-primary-foreground shadow-sm'
									: 'text-muted-foreground hover:text-foreground'
							}`}
						>
							<Calendar className="w-4 h-4" /> Sự kiện
						</button>
					</div>
				)}

				<form onSubmit={onSubmit} className="space-y-4 mt-2">
					{/* Tiêu đề */}
					<div className="space-y-2">
						<label className="text-xs font-medium text-zinc-400">
							{postType === 'EVENT' ? 'Tên sự kiện' : 'Tiêu đề bài viết'}
						</label>
						<Input
							placeholder={
								postType === 'EVENT'
									? 'Ví dụ: SCIENCE TONARDO 2026...'
									: 'Ví dụ: MỞ ĐƠN TUYỂN THÀNH VIÊN...'
							}
							value={postTitle}
							onChange={(e) => setPostTitle(e.target.value)}
							required
						/>
					</div>

					{/* Dành riêng cho EVENT: Thời gian hoạt động */}
					{postType === 'EVENT' ? (
						<div className="space-y-2">
							<label className="text-xs font-medium text-zinc-400">
								Thời gian hoạt động / Tổ chức
							</label>
							<Input
								placeholder="Ví dụ: Tháng 6/2026 - 7/2026"
								value={eventDuration}
								onChange={(e) => setEventDuration(e.target.value)}
								required
							/>
						</div>
					) : (
						/* Dành riêng cho POST: Link form & Deadline */
						<>
							<div className="space-y-2">
								<label className="text-xs font-medium text-zinc-400">
									Link Google Form / Link đăng ký (Tùy chọn)
								</label>
								<Input
									placeholder="Ví dụ: https://forms.gle/..."
									value={postFormUrl}
									onChange={(e) => setPostFormUrl(e.target.value)}
								/>
							</div>

							<div className="space-y-2">
								<label className="text-xs font-medium text-zinc-400">
									Hạn chót / Deadline đăng ký
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
						</>
					)}

					{/* Nội dung chi tiết */}
					<div className="space-y-2">
						<label className="text-xs font-medium text-zinc-400">Mô tả chi tiết</label>
						<Textarea
							placeholder={
								postType === 'EVENT'
									? 'Nhập thông tin giới thiệu, mô tả sự kiện...'
									: 'Nhập nội dung bài viết...'
							}
							rows={4}
							value={postContent}
							onChange={(e) => setPostContent(e.target.value)}
							required
							className="resize-none h-32 overflow-y-auto"
						/>
					</div>

					{/* Upload ảnh */}
					<div>
						<label className="text-xs font-medium text-zinc-400">
							{postType === 'EVENT' ? 'Ảnh banner / poster sự kiện' : 'Ảnh đính kèm'}
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
							) : postType === 'EVENT' ? (
								'Tạo sự kiện'
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