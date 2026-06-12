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
      
      // Logos need PNG for transparency but we can resize them significantly
      const isLogo = base64.startsWith('data:image/png');
      const result = canvas.toDataURL(isLogo ? 'image/png' : 'image/jpeg', isLogo ? undefined : quality);
      resolve(result);
    };
    img.onerror = (err) => reject(err);
  });
}
