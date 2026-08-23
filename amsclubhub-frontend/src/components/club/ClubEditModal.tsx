'use client';

import React, { useState, useRef, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Camera, Image as Loader2, ArrowLeft, X, ChevronDown } from 'lucide-react';
import { api } from '@/lib/api';
import { getFullImageUrl } from '@/lib/utils';

export interface ClubFormData {
  name: string;
  description: string;
  code: string;
  category: string;
  logo_url: string;
  banner_url: string;
  facebook_url: string;
  contact_email: string;
}

// Hàm cắt ảnh từ Canvas
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area
): Promise<File> {
  const image = new Image();
  image.setAttribute('crossOrigin', 'anonymous');
  image.src = imageSrc;

  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = (err) => reject(new Error('Lỗi khi tải ảnh vào bộ nhớ: ' + err));
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Không thể khởi tạo Canvas Context 2D');
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

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

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Lỗi xuất file ảnh từ Canvas'));
          return;
        }
        const file = new File([blob], `cropped-${Date.now()}.jpg`, { type: 'image/jpeg' });
        resolve(file);
      },
      'image/jpeg',
      0.95
    );
  });
}

interface ClubEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: ClubFormData;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  onSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
	showToast?: (message: string, type?: 'success' | 'error') => void;
}

export default function ClubEditModal({
  isOpen,
  onClose,
  formData,
  setFormData,
  onSubmit,
	showToast,
}: ClubEditModalProps) {
  const [cropTarget, setCropTarget] = useState<'logo' | 'banner' | null>(null);
  const [tempImageSrc, setTempImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Quản lý đóng mở dropdown (Dùng ở chọn category)
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  const resetCropState = useCallback(() => {
    setCropTarget(null);
    setTempImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  }, []);

  const handleCloseModal = () => {
    resetCropState();
    onClose();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, target: 'logo' | 'banner') => {
    e.stopPropagation();
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
    e.target.value = '';
  };

  const onCropCompleteHandler = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleCancelCrop = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    resetCropState();
  };

  const handleApplyCrop = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!tempImageSrc || !croppedAreaPixels || !cropTarget) return;

    try {
      setIsUploading(true);

      const file = await getCroppedImg(tempImageSrc, croppedAreaPixels);
      const isLogo = cropTarget === 'logo';

      const uploadData = new FormData();
      uploadData.append('file', file);

      const res = await api.post('/upload/image', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const serverPath =
        res.data?.url ||
        res.data?.file_path ||
        res.data?.path ||
        res.data?.imageUrl ||
        res.data?.data?.url ||
        (res.data?.filename ? `/static/images/${res.data.filename}` : null);

      if (serverPath) {
        const finalUrl = getFullImageUrl(serverPath);

        setFormData((prev: any) => ({
          ...prev,
          [isLogo ? 'logo_url' : 'banner_url']: finalUrl,
        }));
      } else {
        console.error('Phản hồi từ Server:', res.data);
        showToast?.('Tải ảnh thất bại: Backend không trả về đường dẫn file hợp lệ', 'error');
      }
    } catch (err: any) {
      console.error('Lỗi crop/upload ảnh:', err);
      showToast?.(err?.response?.data?.detail || err?.response?.data?.message || 'Có lỗi xảy ra khi tải ảnh', 'error');
    } finally {
      setIsUploading(false);
      resetCropState();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCloseModal()}>
      <DialogContent className="sm:max-w-lg bg-black text-white border border-zinc-800 max-h-[90vh] overflow-y-auto p-6 rounded-2xl shadow-2xl">
        {/* MÀN HÌNH CẮT ẢNH */}
        {cropTarget && tempImageSrc ? (
          <div className="space-y-4">
            <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-zinc-800">
              <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancelCrop}
                  className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                {cropTarget === 'logo'
                  ? 'Cắt ảnh Logo'
                  : 'Cắt ảnh Banner'}
              </DialogTitle>
            </DialogHeader>

            {/* Khung chứa Cropper */}
            <div className="relative w-full h-[320px] bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800">
              <Cropper
                image={tempImageSrc}
                crop={crop}
                zoom={zoom}
                aspect={cropTarget === 'logo' ? 1 : 16 / 5}
                cropShape={cropTarget === 'logo' ? 'round' : 'rect'}
                objectFit="contain"
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropCompleteHandler}
              />
            </div>

            {/* Thanh Zoom */}
            <div className="flex items-center gap-3 px-2">
              <span className="text-xs font-medium text-zinc-400 shrink-0">Thu phóng:</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-white cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
              />
            </div>

            {/* Nút thao tác */}
            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
              <Button
                type="button"
                variant="ghost"
                onClick={handleCancelCrop}
                disabled={isUploading}
                className="text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-full px-5"
              >
                Hủy
              </Button>
              <Button
                type="button"
                onClick={handleApplyCrop}
                disabled={isUploading}
                className="bg-white hover:bg-zinc-200 text-black font-semibold rounded-full px-5"
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
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <DialogTitle className="text-lg font-bold text-white">
                Chỉnh sửa thông tin
              </DialogTitle>
            </div>
          </DialogHeader>

          <form onSubmit={onSubmit} className="space-y-4 mt-2">
            {/* KHU VỰC BANNER & LOGO */}
            <div className="relative pt-2 pb-8">
              {/* Banner Box */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  bannerInputRef.current?.click();
                }}
                className="relative w-full aspect-[16/5] bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 cursor-pointer group"
              >
                <img
                  src={formData.banner_url || '/static/images/default-banner.png'}
                  alt="Banner preview"
                  className="w-full h-full object-cover brightness-90 group-hover:brightness-75 transition-all"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="p-3 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors backdrop-blur-sm">
                    <Camera className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Logo Box */}
              <div className="absolute left-4 -bottom-2">
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    logoInputRef.current?.click();
                  }}
                  className="relative w-20 h-20 rounded-full border-4 border-black bg-zinc-900 shadow-lg overflow-hidden cursor-pointer group"
                >
                  <img
                    src={formData.logo_url || '/static/images/default-logo.png'}
                    alt="Logo preview"
                    className="w-full h-full object-cover brightness-90 group-hover:brightness-75 transition-all"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-5 h-5 text-white" />
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

            {/* Dữ liệu nhập liệu */}
            {/* Tên */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-400">Tên câu lạc bộ</label>
              <Input
                className="bg-black border-zinc-800 focus:border-zinc-400 text-white placeholder:text-zinc-600 rounded-lg focus-visible:ring-0 focus-visible:ring-offset-0"
                value={formData.name || ''}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            
            {/* Code */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-400">Mã câu lạc bộ</label>
              <Input
                className="bg-black border-zinc-800 focus:border-zinc-400 text-white placeholder:text-zinc-600 rounded-lg focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="Ví dụ: HAMAC"
                value={formData.code || ''}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, code: e.target.value.toUpperCase() }))}
              />
            </div>

            {/* Category */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-400">Lĩnh vực / Thể loại</label>
              <div className="relative">
                {/* Ô hiển thị chính */}
                <button
                  type="button"
                  onClick={() => setIsCategoryOpen((prev) => !prev)}
                  className={`w-full h-8.5 bg-zinc-900/50 border border-zinc-800 text-left px-3 text-sm transition-all flex items-center justify-between cursor-pointer focus:outline-none ${
                    isCategoryOpen
                      ? 'rounded-t-lg border-blue-500 border-b-zinc-800 bg-zinc-900'
                      : 'rounded-lg hover:border-zinc-700 focus:border-blue-500'
                  } ${!formData.category ? 'text-zinc-600' : 'text-white'}`}
                >
                  <span>{formData.category || '-- Chọn thể loại --'}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${
                      isCategoryOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Menu danh sách Lựa chọn (Xổ liền bên dưới, bo tròn góc đáy, viền zinc-800) */}
                {isCategoryOpen && (
                  <>
                    {/* Lớp phủ ẩn để click ra bên ngoài thì tự đóng menu */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsCategoryOpen(false)}
                    />

                    <div className="absolute top-full left-0 right-0 -mt-[1px] z-20 bg-zinc-900 border border-t-0 border-zinc-800 rounded-b-lg shadow-xl overflow-hidden">
                      {['Thể thao', 'Nghệ thuật', 'Học thuật', 'Xã hội'].map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => {
                            setFormData((prev: any) => ({ ...prev, category: item }));
                            setIsCategoryOpen(false);
                          }}
                          className={`w-full text-left px-2 py-1.5 text-sm transition-colors hover:bg-zinc-800 cursor-pointer last:rounded-b-lg ${
                            formData.category === item ? 'bg-zinc-800/80 font-medium text-white' : 'text-zinc-300'
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Mô tả câu lạc bộ */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-400">Mô tả câu lạc bộ</label>
              <Textarea
                rows={3}
                className="bg-black border-zinc-800 focus:border-zinc-400 text-white placeholder:text-zinc-600 rounded-lg focus-visible:ring-0 focus-visible:ring-offset-0 resize-none"
                value={formData.description || ''}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, description: e.target.value }))}
              />
            </div>

            {/* Link fanpage facebook */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-400">Link Fanpage Facebook</label>
              <Input
                className="bg-black border-zinc-800 focus:border-zinc-400 text-white placeholder:text-zinc-600 rounded-lg focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="https://facebook.com/..."
                value={formData.facebook_url || ''}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, facebook_url: e.target.value }))}
              />
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-400">Email liên hệ</label>
              <Input
                type="email"
                className="bg-black border-zinc-800 focus:border-zinc-400 text-white placeholder:text-zinc-600 rounded-lg focus-visible:ring-0 focus-visible:ring-offset-0"
                value={formData.contact_email || ''}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, contact_email: e.target.value }))}
              />
            </div>

            <DialogFooter className="pt-4 border-t border-zinc-800 flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={handleCloseModal}
                className="text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-full px-5"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="bg-white hover:bg-zinc-200 text-black font-bold rounded-full px-6"
              >
                Lưu thay đổi
              </Button>
            </DialogFooter>
          </form>
        </>
        )}
      </DialogContent>
    </Dialog>
  );
}