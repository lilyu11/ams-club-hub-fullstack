'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { getFullImageUrl } from '@/lib/utils';
import { Upload, X, Loader2 } from 'lucide-react';

interface ImageUploadProps {
	value?: string;
	onChange: (url: string) => void;
	disabled?: boolean;
	aspectRatio?: 'square' | 'banner' | 'post';
	uploadEndpoint: string; // Mặc định là /upload/image 
	fieldName?: string;      // Tên field backend nhận (mặc định là 'file')
}

export default function ImageUpload({
	value,
	onChange,
	disabled,
	aspectRatio = 'square',
	uploadEndpoint = '/upload/image',
	fieldName="file",
}: ImageUploadProps) {
	const [uploading, setUploading] = useState(false);

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		if (!file.type.startsWith('image/')) {
			alert('Vui lòng chỉ chọn file hình ảnh (PNG, JPG, WEBP)');
			return;
		}

		try {
			setUploading(true);
			const formData = new FormData();
			formData.append(fieldName || 'file', file);

			// Request đăng ảnh lên Router Upload của Backend
			const res = await api.post(uploadEndpoint, formData, {
				headers: { 'Content-Type': 'multipart/form-data' },
			});

			// Đọc tất cả các dạng key phổ biến mà Backend trả về
			const rawUrl =
				res.data?.url ||
				res.data?.file_path ||
				res.data?.path ||
				res.data?.image_url ||
				(res.data?.filename ? `/static/uploads/${res.data.filename}` : null);

			if (rawUrl) {
				// Chuyển thành URL chuẩn trước khi trả về Form cho component cha
				const finalUrl = getFullImageUrl(rawUrl);
				onChange(finalUrl); 
			} else {
				console.error('Phản hồi từ server:', res.data);
				alert('Upload thành công nhưng không tìm thấy URL hợp lệ trong phản hồi');
			}
		} catch (error: any) {
			console.error('Lỗi upload ảnh:', error);
			alert(
				error?.response?.data?.detail || 
				error?.response?.data?.message || 
				'Upload ảnh thất bại. Kiểm tra lại kết nối Server'
			);
		} finally {
			setUploading(false);
			// Reset value của input file để có thể chọn lại chính file này nếu muốn
			e.target.value = '';
		}
	};

	const getContainerClass = () => {
		switch (aspectRatio) {
			case 'banner':
				return 'w-full h-36';
			case 'post':
				return 'w-full aspect-video';
			default:
				return 'w-28 h-28';
		}
	};

	return (
		<div className="space-y-2">
			{value ? (
				<div className={`relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100 ${getContainerClass()}`}>
					<img
						src={getFullImageUrl(value)}
						alt="Preview"
						className="w-full h-full object-cover"
					/>
					<button
						type="button"
						onClick={() => onChange('')}
						disabled={disabled}
						className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-full shadow-md hover:bg-rose-700 active:scale-95 transition-all"
						title="Xóa / Chọn ảnh khác"
					>
						<X className="w-4 h-4" />
					</button>
				</div>
			) : (
				<label
					className={`flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl cursor-pointer bg-slate-50 hover:bg-indigo-50/50 transition-all ${getContainerClass()}`}
				>
					{uploading ? (
						<div className="flex flex-col items-center gap-2">
							<Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
							<span className="text-xs text-slate-500 font-medium">Đang tối ưu & tải ảnh lên...</span>
						</div>
					) : (
						<div className="flex flex-col items-center gap-1.5 p-4 text-center">
							<Upload className="w-6 h-6 text-slate-400" />
							<span className="text-xs font-semibold text-slate-600">Chọn ảnh từ máy</span>
						</div>
					)}

					<input
						type="file"
						accept="image/*"
						onChange={handleFileChange}
						disabled={disabled || uploading}
						className="hidden"
					/>
				</label>
			)}
		</div>
	);
}