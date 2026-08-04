import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '@/utils/cropUtils';

interface CropperModalProps {
	imageSrc: string;
	aspectRatio: number; // 1/1 cho Logo, 16/5 cho Banner
	title?: string;
	onCropComplete: (result: { file: File; url: string }) => void;
	onCancel: () => void;
}

export default function ImageCropperModal({
	imageSrc,
	aspectRatio,
	title = 'Chỉnh sửa kích thước ảnh',
	onCropComplete,
	onCancel,
}: CropperModalProps) {
	const [crop, setCrop] = useState({ x: 0, y: 0 });
	const [zoom, setZoom] = useState(1);
	const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

	const onCropCompleteHandler = useCallback((_: any, croppedPixels: any) => {
		setCroppedAreaPixels(croppedPixels);
	}, []);

	const handleSave = async () => {
		try {
			if (croppedAreaPixels) {
				const croppedResult = await getCroppedImg(imageSrc, croppedAreaPixels);
				onCropComplete(croppedResult);
			}
		} catch (e) {
			console.error('Lỗi crop ảnh:', e);
		}
	};

	return (
		<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
			<div className="relative w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-2xl space-y-4">
				{/* Header */}
				<div className="p-4 border-b border-slate-100 flex justify-between items-center">
					<h3 className="font-bold text-slate-800 text-sm">{title}</h3>
					<button onClick={onCancel} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
				</div>

				{/* Khung Crop */}
				<div className="relative h-72 w-full bg-slate-900">
					<Cropper
						image={imageSrc}
						crop={crop}
						zoom={zoom}
						aspect={aspectRatio}
						onCropChange={setCrop}
						onZoomChange={setZoom}
						onCropComplete={onCropCompleteHandler}
					/>
				</div>

				{/* Zoom Slider & Actions */}
				<div className="p-4 space-y-4">
					<div className="flex items-center gap-3">
						<span className="text-xs text-slate-500 font-medium">Thu phóng:</span>
						<input
							type="range"
							min={1}
							max={3}
							step={0.1}
							value={zoom}
							onChange={(e) => setZoom(Number(e.target.value))}
							className="w-full accent-indigo-600 cursor-pointer"
						/>
					</div>

					<div className="flex justify-end gap-2 pt-2">
						<button
							onClick={onCancel}
							className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
						>
							Hủy
						</button>
						<button
							onClick={handleSave}
							className="px-5 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-sm transition-all"
						>
							Áp dụng
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}