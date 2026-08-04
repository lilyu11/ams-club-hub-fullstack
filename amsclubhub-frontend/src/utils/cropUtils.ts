// src/utils/cropUtils.ts
export const getCroppedImg = async (
	imageSrc: string,
	pixelCrop: { x: number; y: number; width: number; height: number },
	fileName: string = 'cropped-image.jpg'
): Promise<{ file: File; url: string }> => {
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
				reject(new Error('Canvas is empty'));
				return;
			}
			const file = new File([blob], fileName, { type: 'image/jpeg' });
			const url = URL.createObjectURL(blob);
			resolve({ file, url });
		}, 'image/jpeg', 0.95);
	});
};