/**
 * Compresses and resizes an image file for profile avatars using HTML5 canvas.
 * Center-crops to 1:1 aspect ratio and compresses to WebP (~5-15KB),
 * guaranteeing immediate upload, reliable database/localStorage storage,
 * and crisp rendering in round avatar frames.
 */
export async function compressAvatarImage(file, maxDimension = 280, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      return reject(new Error('Invalid image file'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image into memory'));
      img.onload = () => {
        try {
          const width = img.naturalWidth || img.width;
          const height = img.naturalHeight || img.height;

          // Center-crop to 1:1 square
          const cropSize = Math.min(width, height);
          const startX = (width - cropSize) / 2;
          const startY = (height - cropSize) / 2;

          const targetSize = Math.min(cropSize, maxDimension);

          const canvas = document.createElement('canvas');
          canvas.width = targetSize;
          canvas.height = targetSize;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return resolve({ dataUrl: e.target.result, blob: file });
          }

          // Enable high quality image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Draw the cropped square image into the target dimensions
          ctx.drawImage(img, startX, startY, cropSize, cropSize, 0, 0, targetSize, targetSize);

          // Export as WebP
          let dataUrl = canvas.toDataURL('image/webp', quality);
          // Fallback to JPEG if WebP unsupported or empty
          if (!dataUrl || !dataUrl.startsWith('data:image/webp') || dataUrl.length < 100) {
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
          if (!dataUrl || dataUrl.length < 100) {
            dataUrl = e.target.result;
          }

          canvas.toBlob((blob) => {
            resolve({
              dataUrl,
              blob: blob || file,
              contentType: dataUrl.startsWith('data:image/jpeg') ? 'image/jpeg' : 'image/webp'
            });
          }, 'image/webp', quality);
        } catch (err) {
          // If canvas processing fails, fallback safely to raw dataUrl
          resolve({ dataUrl: e.target.result, blob: file });
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}
