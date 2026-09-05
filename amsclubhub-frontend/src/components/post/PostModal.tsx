'use client';

import { useState, useEffect } from 'react';
import { PostData } from '@/types/club';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, FileText, Calendar } from 'lucide-react';
import ImageUpload from '@/components/ui/ImageUpload';
import DateTimePicker from '@/components/ui/DateTimePicker';

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
	postEmailMessage: string;
	setPostEmailMessage: (val: string) => void;
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
	postEmailMessage,
	setPostEmailMessage,
	postType,
	setPostType,
	eventDuration,
	setEventDuration,
	submitting,
	onSubmit,
}: PostModalProps) {
	// Kiểm tra xem deadline đã qua chưa (chỉ khi edit)
	const isDeadlinePassed = editingPost && editingPost.deadline
		? new Date(editingPost.deadline) <= new Date()
		: false;

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="bg-background dark:bg-zinc-900 max-h-[85vh] overflow-y-auto overflow-x-hidden pr-4 text-foreground dark:text-zinc-100 border-border dark:border-zinc-800 sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>
						{editingPost
							? postType === 'EVENT' ? 'Chỉnh sửa sự kiện' : 'Chỉnh sửa bài đăng'
							: 'Tạo bài viết / Sự kiện mới'}
					</DialogTitle>
				</DialogHeader>

				{/* CHỌN BÀI ĐĂNG HOẶC SỰ KIỆN */}
				{!editingPost && (
					<div className="inline-flex items-center gap-1 p-1 bg-muted rounded-xl w-fit justify-self-start">
						<button
							type="button"
							onClick={() => setPostType('POST')}
							className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${postType === 'POST'
								? 'bg-background text-foreground shadow-sm'
								: 'text-muted-foreground hover:text-foreground'
								}`}
						>
							<FileText className="w-4 h-4" /> Bài đăng
						</button>
						<button
							type="button"
							onClick={() => setPostType('EVENT')}
							className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${postType === 'EVENT'
								? 'bg-primary text-primary-foreground shadow-sm'
								: 'text-muted-foreground hover:text-foreground'
								}`}
						>
							<Calendar className="w-4 h-4" /> Sự kiện
						</button>
					</div>
				)}

				<form onSubmit={onSubmit} className="space-y-4 mt-2 pr-2">
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
							className="break-words"
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
								className="break-words"
							/>
						</div>
					) : (
						/* Dành riêng cho POST: Link form & Deadline */
						<>
							<div className="space-y-2">
								<label className="text-xs font-medium text-zinc-400">
									Link bài viết gốc / Link đăng ký (Tùy chọn)
								</label>
								<Input
									placeholder="Ví dụ: https://forms.gle/..."
									value={postFormUrl}
									onChange={(e) => setPostFormUrl(e.target.value)}
									className="break-words"
								/>
							</div>

							<div className="space-y-2">
								<label className="text-xs font-medium text-zinc-400">
									Hạn chót / Ngày thông báo
									{isDeadlinePassed && (
										<span className="ml-2 text-xs text-muted-foreground">(Đã qua deadline, không thể sửa)</span>
									)}
								</label>
								<DateTimePicker
									value={postDeadline}
									onChange={setPostDeadline}
									placeholder="Chọn thời gian thông báo (MM/DD/YYYY)"
									disabled={isDeadlinePassed}
								/>
							</div>

							<div className="space-y-2">
								<label className="text-xs font-medium text-zinc-400">
									Lời nhắc nhở trong email
									</label>
								<Textarea
									placeholder={
										'Nhập lời nhắn gửi tới trong email thông báo...'
									}
									rows={4}
									value={postEmailMessage}
									onChange={(e) => setPostEmailMessage(e.target.value)}
									className="resize-none h-16 overflow-y-auto break-words w-full"
									style={{ fieldSizing: 'fixed' }}
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
							className="resize-none h-32 overflow-y-auto break-words w-full"
							style={{ fieldSizing: 'fixed' }}
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