/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Resizes and compresses an image to fit within Firestore limits.
 * Targeted for around 100-200kb per image.
 */
export async function compressImage(base64: string, maxWidth = 500, quality = 0.5): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to webp if possible, otherwise jpeg, keeping quality around 0.5 for ultra-efficiency
      // WebP supports transparency beautifully while keeping file sizes up to 10x smaller than raw PNGs!
      let result = '';
      try {
        result = canvas.toDataURL('image/webp', quality);
        if (!result.startsWith('data:image/webp')) {
          // Fallback if browser doesn't support webp
          const isPng = base64.startsWith('data:image/png');
          result = canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', isPng ? undefined : quality);
        }
      } catch (e) {
        const isPng = base64.startsWith('data:image/png');
        result = canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', isPng ? undefined : quality);
      }
      resolve(result);
    };
    img.onerror = (err) => reject(err);
  });
}
