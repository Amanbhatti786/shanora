/**
 * Client-side Canvas Image Compressor
 * Converts heavy images (5MB-10MB) to optimized WebP/JPEG (~200KB-300KB)
 * before uploading to Supabase Storage.
 */
export async function compressImage(file, maxWidth = 1200, quality = 0.75) {
  // Agar file image na ho to as-it-is return karein
  if (!file || !file.type.startsWith('image/')) return file;

  // Agar file pehle se 250KB se choti hai to mazeed compress karne ki zaroorat nahi
  if (file.size <= 250 * 1024) return file;

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Aspect ratio barkarar rakhte hue scale down karna
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // WebP format conversion
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file); // Fallback to original if compression fails
              return;
            }
            const compressedFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, '') + '.webp',
              {
                type: 'image/webp',
                lastModified: Date.now(),
              }
            );
            resolve(compressedFile);
          },
          'image/webp',
          quality
        );
      };

      img.onerror = () => resolve(file);
    };

    reader.onerror = () => resolve(file);
  });
}
