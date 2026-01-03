import type { SharpInput } from 'sharp';
import sharp from 'sharp';

export const fileToDataURL = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onload = () => resolve(fileReader.result as string);
    fileReader.onerror = () => reject('error reading file');
    fileReader.readAsDataURL(file);
  });

export const replaceFileExtension = (fileName: string, newExtension: string) => {
  const lastDotIndex = fileName.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return fileName + newExtension;
  }
  return fileName.substring(0, lastDotIndex) + newExtension;
};

/**
 * Reduces image size to fit within maxWidth and maxHeight while maintaining aspect ratio.
 * @param fileOfBuffer
 * @param maxWidth
 * @param maxHeight
 * @param quality optional quality for JPG output (1-100), default = 90
 * @returns  a Promise that resolves to a JPG Buffer containing the resized image data.
 */
export const reduceImageSizeToWebp = async (
  fileOfBuffer: File | SharpInput,
  maxWidth: number,
  maxHeight: number,
  quality?: number
): Promise<Buffer> => {
  const imageBuffer = fileOfBuffer instanceof File ? await fileOfBuffer.arrayBuffer() : fileOfBuffer;
  const sharpImage = sharp(imageBuffer);
  const metadata = await sharpImage.metadata();

  let width = metadata.width || maxWidth;
  let height = metadata.height || maxHeight;

  if (width > maxWidth || height > maxHeight) {
    const aspectRatio = width / height;
    if (width > height) {
      width = maxWidth;
      height = Math.round(maxWidth / aspectRatio);
    } else {
      height = maxHeight;
      width = Math.round(maxHeight * aspectRatio);
    }
  }

  const imageBufferFinal = sharpImage
    .resize(width, height, { withoutEnlargement: true, fit: 'inside' })
    .withMetadata()
    .webp({ quality: quality || 90 })
    .toBuffer();
  return imageBufferFinal;
};
