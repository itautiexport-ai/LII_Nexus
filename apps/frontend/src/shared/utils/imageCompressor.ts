/**
 * Client-side image compression utility.
 * Resizes large photos (such as modern phone camera captures) to fit within
 * maxDimension and re-encodes as JPEG with quality compression.
 * This ensures uploads stay well below server/reverse-proxy size limits (e.g. 1MB Nginx defaults)
 * and upload quickly and reliably over mobile networks.
 */
export async function compressImage(
  file: File,
  maxDimension = 1280,
  quality = 0.75
): Promise<File> {
  // If not an image, return original file
  if (!file.type || !file.type.startsWith("image/")) {
    return file;
  }

  // If already under 400KB, it is safe to upload directly
  if (file.size < 400 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            return resolve(file);
          }

          ctx.drawImage(img, 0, 0, width, height);

          if (canvas.toBlob) {
            canvas.toBlob(
              (blob) => {
                if (!blob) return resolve(file);
                const newName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
                const compressed = new File([blob], newName, {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                });
                resolve(compressed);
              },
              "image/jpeg",
              quality
            );
          } else {
            const dataUrl = canvas.toDataURL("image/jpeg", quality);
            const byteString = atob(dataUrl.split(",")[1]);
            const mimeString = dataUrl.split(",")[0].split(":")[1].split(";")[0];
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
              ia[i] = byteString.charCodeAt(i);
            }
            const blob = new Blob([ab], { type: mimeString });
            const newName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
            const compressed = new File([blob], newName, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            resolve(compressed);
          }
        } catch (err) {
          console.warn("Image compression failed, using original file:", err);
          resolve(file);
        }
      };
      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}
