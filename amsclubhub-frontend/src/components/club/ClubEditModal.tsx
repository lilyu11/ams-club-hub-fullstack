'use client';

import React, { useState, useRef, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Camera, Image as ImageIcon, Loader2, ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { getFullImageUrl } from '@/lib/utils';

// Hàm cắt ảnh từ Canvas
async function getCroppedImg(
	imageSrc: string,
	pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<{ file: File; url: string }> {
	const image = new Image();
	image.src = imageSrc;
	await new Promise((resolve) => (image.onload = resolve));

	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');

	canvas.width = pixelCrop.width;
	canvas.height = pixelCrop.height;

	if (ctx) {
		ctx.drawImage(
			image,
			pixelCrop.x,
			pixelCrop.y,
			pixelCrop.width,
			pixelCrop.height,
			0,
			0,
			pixelCrop.width,
			pixelCrop.height
		);
	}

	return new Promise((resolve, reject) => {
		canvas.toBlob((blob) => {
			if (!blob) {
				reject(new Error('Lỗi xuất file ảnh'));
				return;
			}
			const file = new File([blob], `cropped-${Date.now()}.jpg`, { type: 'image/jpeg' });
			const url = URL.createObjectURL(blob);
			resolve({ file, url });
		}, 'image/jpeg', 0.95);
	});
}

interface ClubEditModalProps {
	isOpen: boolean;
	onClose: () => void;
	formData: {
		name: string;
		description: string;
		category: string;
		logo_url: string;
		banner_url: string;
		facebook_url: string;
		contact_email: string;
	};
	setFormData: React.Dispatch<React.SetStateAction<any>>;
	onSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
}

export default function ClubEditModal({
	isOpen,
	onClose,
	formData,
	setFormData,
	onSubmit,
}: ClubEditModalProps) {
	// Trạng thái Crop
	const [cropTarget, setCropTarget] = useState<'logo' | 'banner' | null>(null);
	const [tempImageSrc, setTempImageSrc] = useState<string | null>(null);
	const [crop, setCrop] = useState({ x: 0, y: 0 });
	const [zoom, setZoom] = useState(1);
	const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
	const [isUploading, setIsUploading] = useState<boolean>(false);

	// Input refs
	const logoInputRef = useRef<HTMLInputElement>(null);
	const bannerInputRef = useRef<HTMLInputElement>(null);

	// 1. Khi chọn file từ máy tính
	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, target: 'logo' | 'banner') => {
		e.stopPropagation(); // Chống nổi bọt sự kiện
		const file = e.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = () => {
				setTempImageSrc(reader.result as string);
				setCropTarget(target);
				setZoom(1);
				setCrop({ x: 0, y: 0 });
			};
			reader.readAsDataURL(file);
		}
		e.target.value = ''; // Reset input để có thể chọn lại file cùng tên
	};

	const onCropCompleteHandler = useCallback((_: any, croppedPixels: any) => {
		setCroppedAreaPixels(croppedPixels);
	}, []);

	// 2. Hủy Crop
	const handleCancelCrop = (e?: React.MouseEvent) => {
		if (e) e.stopPropagation();
		setCropTarget(null);
		setTempImageSrc(null);
	};

	// 3. Xác nhận Crop ảnh & Upload
	const handleApplyCrop = async (e: React.MouseEvent) => {
		e.stopPropagation();
		if (!tempImageSrc || !croppedAreaPixels || !cropTarget) return;

		try {
			setIsUploading(true);
			
			// Bỏ biến `url` (blob tạm) khỏi destructuring để tránh lấy nhầm
			const { file } = await getCroppedImg(tempImageSrc, croppedAreaPixels);
			const isLogo = cropTarget === 'logo';

			// Tạo FormData gửi Backend
			const uploadData = new FormData();
			uploadData.append('file', file);

			// Thêm Header multipart cho request
			const res = await api.post('/upload/image', uploadData, {
				headers: {
					'Content-Type': 'multipart/form-data',
				},
			});

			// Các kiểu tên key phổ biến mà Backend (FastAPI/Node) có thể trả về
			const serverPath =
				res.data?.url ||
				res.data?.file_path ||
				res.data?.path ||
				res.data?.imageUrl ||
				res.data?.data?.url ||
				(res.data?.filename ? `/static/images/${res.data.filename}` : null);

			// Nếu Backend upload thành công và có path
			if (serverPath) {
				// Bọc qua getFullImageUrl để đảm bảo đường dẫn đúng (port 8000)
				const finalUrl = getFullImageUrl(serverPath);

				setFormData((prev: any) => ({
					...prev,
					[isLogo ? 'logo_url' : 'banner_url']: finalUrl,
				}));
			} else {
				console.error('Phản hồi từ Server:', res.data);
				alert('Tải ảnh thất bại: Backend không trả về đường dẫn file hợp lệ');
			}
		} catch (err: any) {
				console.error('Lỗi crop/upload ảnh:', err);
				alert(err?.response?.data?.detail || err?.response?.data?.message || 'Có lỗi xảy ra khi tải ảnh');
		} finally {
				setIsUploading(false);
				setCropTarget(null);
				setTempImageSrc(null);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-lg bg-white max-h-[90vh] overflow-y-auto p-6">
				
				{/* MÀN HÌNH CẮT ẢNH (CHỈ HIỆN KHU VỰC CROP) */}
				{cropTarget && tempImageSrc ? (
					<div className="space-y-4">
						<DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<DialogTitle className="text-base font-bold flex items-center gap-2">
								<button
									type="button"
									onClick={handleCancelCrop}
									className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
								>
									<ArrowLeft className="w-4 h-4" />
								</button>
								{cropTarget === 'logo'
									? 'Cắt ảnh Logo (Hình vuông 1:1)'
									: 'Cắt ảnh Banner (Chữ nhật 16:5)'}
							</DialogTitle>
						</DialogHeader>

						{/* Khung chứa Cropper với objectFit="contain" giữ nguyên dáng ảnh gốc */}
						<div className="relative w-full h-[320px] bg-slate-900 rounded-2xl overflow-hidden">
							<Cropper
								image={tempImageSrc}
								crop={crop}
								zoom={zoom}
								aspect={cropTarget === 'logo' ? 1 : 16 / 5}
								objectFit="contain" // Fix lỗi 1: Giữ nguyên tỷ lệ ảnh gốc, không ép thành hình vuông
								onCropChange={setCrop}
								onZoomChange={setZoom}
								onCropComplete={onCropCompleteHandler}
							/>
						</div>

						{/* Thanh Zoom */}
						<div className="flex items-center gap-3 px-2">
							<span className="text-xs font-semibold text-slate-500 shrink-0">Thu phóng:</span>
							<input
								type="range"
								min={1}
								max={3}
								step={0.1}
								value={zoom}
								onChange={(e) => setZoom(Number(e.target.value))}
								className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
							/>
						</div>

						{/* Nút thao tác */}
						<div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
							<Button
								type="button"
								variant="outline"
								onClick={handleCancelCrop}
								disabled={isUploading}
							>
								Hủy
							</Button>
							<Button
								type="button"
								onClick={handleApplyCrop}
								disabled={isUploading}
								className="bg-indigo-600 hover:bg-indigo-700 text-white"
							>
								{isUploading ? (
									<>
										<Loader2 className="w-4 h-4 animate-spin mr-2" /> Đang tải...
									</>
								) : (
									'Áp dụng'
								)}
							</Button>
						</div>
					</div>
				) : (

				/* FORM CHỈNH SỬA THÔNG TIN CLB */
					<>
						<DialogHeader>
							<DialogTitle>Chỉnh sửa thông tin Câu lạc bộ</DialogTitle>
						</DialogHeader>

						<form onSubmit={onSubmit} className="space-y-4 mt-2">
							
							{/* KHU VỰC BANNER & LOGO */}
							<div className="space-y-1">
								<label className="text-sm font-medium text-slate-700">Hình ảnh đại diện & Banner</label>
								
								<div className="relative pt-2 pb-6">
									{/* Banner Box */}
									<div
										onClick={(e) => {
											e.stopPropagation();
											bannerInputRef.current?.click();
										}}
										className="relative w-full aspect-[16/5] bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 cursor-pointer group transition-all"
									>
										<img
											src={formData.banner_url || '/static/images/default-banner.png'}
											alt="Banner preview"
											className="w-full h-full object-cover"
										/>
										<div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 text-white text-xs font-semibold transition-opacity">
											<ImageIcon className="w-4 h-4" />
											<span>Đổi ảnh Banner</span>
										</div>
									</div>

									{/* Logo Box */}
									<div className="absolute left-4 -bottom-1">
										<div
											onClick={(e) => {
												e.stopPropagation();
												logoInputRef.current?.click();
											}}
											className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-white bg-white shadow-md overflow-hidden cursor-pointer group"
										>
											<img
												src={formData.logo_url || '/static/images/default-logo.png'}
												alt="Logo preview"
												className="w-full h-full object-cover"
											/>
											<div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
												<Camera className="w-5 h-5" />
											</div>
										</div>
									</div>
								</div>

								{/* File inputs ẩn */}
								<input
									ref={logoInputRef}
									type="file"
									accept="image/*"
									className="hidden"
									onChange={(e) => handleFileSelect(e, 'logo')}
								/>
								<input
									ref={bannerInputRef}
									type="file"
									accept="image/*"
									className="hidden"
									onChange={(e) => handleFileSelect(e, 'banner')}
								/>
							</div>

							{/* DỮ LIỆU NHẬP LIỆU */}
							<div className="space-y-2">
								<label className="text-sm font-medium">Tên câu lạc bộ</label>
								<Input
									value={formData.name}
									onChange={(e) => setFormData({ ...formData, name: e.target.value })}
									required
								/>
							</div>

							<div className="space-y-2">
								<label className="text-sm font-medium">Lĩnh vực / Thể loại</label>
								<Input
									placeholder="Ví dụ: Nghệ thuật, Học thuật, Thể thao..."
									value={formData.category}
									onChange={(e) => setFormData({ ...formData, category: e.target.value })}
								/>
							</div>

							<div className="space-y-2">
								<label className="text-sm font-medium">Mô tả câu lạc bộ</label>
								<Textarea
									rows={3}
									value={formData.description}
									onChange={(e) => setFormData({ ...formData, description: e.target.value })}
								/>
							</div>

							<div className="space-y-2">
								<label className="text-sm font-medium">Link Fanpage Facebook</label>
								<Input
									placeholder="https://facebook.com/..."
									value={formData.facebook_url}
									onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
								/>
							</div>

							<div className="space-y-2">
								<label className="text-sm font-medium">Email liên hệ</label>
								<Input
									type="email"
									value={formData.contact_email}
									onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
								/>
							</div>

							<DialogFooter className="pt-3">
								<Button type="button" variant="outline" onClick={onClose}>
									Hủy
								</Button>
								<Button type="submit">Lưu thay đổi</Button>
							</DialogFooter>
						</form>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}