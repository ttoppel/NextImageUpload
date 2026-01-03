import type { Readable } from 'node:stream';
import type { TypedPromiseConstructor } from '@/types/typed-promise';

import shortRandom from '@/utils/shortRandom';
import { S3Client, PutObjectCommand, S3ServiceException, DeleteObjectCommand } from '@aws-sdk/client-s3';

export type PayloadTypes = string | Uint8Array | Buffer | Readable;

export const ID_PREFIX = '(';
export const ID_SUFFIX = ')';
export const SIZE_PREFIX = '{';
export const SIZE_SUFFIX = '}';
export const AVATAR_FOLDER = 'avatar';
export const ARTIST_PAGE_PREFIX = 'A';

export const FOLDER_INDEX = 0;
export const FILE_INDEX = 1;
export const ID_INDEX = 2;
export const SIZE_INDEX = 3;

export type SIZE = 'sm' | 'md' | 'lg' | 'xl' | '';

export interface IFileKey {
  fileName: string;
  fileFolder: string;
  insertId: boolean;
  id?: string;
  idPrefix?: string;
  size?: string;
  toString(): string;
  parse(path: string): void;
  equals(otherFileKey: FileKey | null | undefined): boolean;
  equivalant(otherFileKey: FileKey | null | undefined): boolean;
  imageURL(): string;
}
export class FileKey implements IFileKey {
  fileName: string;
  fileFolder: string;
  insertId: boolean;
  id?: string;
  idPrefix?: string;
  size?: string;

  constructor(
    folder: string = '',
    fname: string = '',
    sizeTag: string | undefined = undefined,
    prefixId: string | undefined = undefined,
    insertid: boolean = false
  ) {
    this.fileName = fname ? normalizeFilePart(fname) : '';
    this.fileFolder = folder; // domain or other directory
    this.insertId = insertid;
    this.size = sizeTag;
    this.idPrefix = prefixId;
  }

  parse(path: string): FileKey {
    const parts = extractFileKeyParts(path);
    this.fileFolder = parts[FOLDER_INDEX] || '';
    this.fileName = parts[FILE_INDEX] || '';
    this.id = parts[ID_INDEX] || '';
    this.size = parts[SIZE_INDEX] || '';
    this.insertId = this.id ? true : false;
    return this;
  }

  equals(otherFileKey: FileKey | null | undefined): boolean {
    if (!otherFileKey) return false;
    if ((this.id && !otherFileKey.id) || (!this.id && otherFileKey.id)) return false;
    if (this.id && otherFileKey.id && !equalsIgnoringCase(this.id, otherFileKey.id)) return false;
    return equalsIgnoringCase(this.fileFolder, otherFileKey.fileFolder) && equalsIgnoringCase(this.fileName, otherFileKey.fileName);
  }

  equivalant(otherFileKey: FileKey | null | undefined): boolean {
    if (!otherFileKey) return false;
    return equalsIgnoringCase(this.fileFolder, otherFileKey.fileFolder) && equalsIgnoringCase(this.fileName, otherFileKey.fileName);
  }

  imageURL(): string {
    if (!this.id && this.insertId) this.id = this.idPrefix ? this.idPrefix + shortRandom() : shortRandom().toString();
    return imageURL(this.fileFolder, this.fileName, this.id, this.size);
  }

  toString(): string {
    if (!this.id && this.insertId) this.id = this.idPrefix ? this.idPrefix + shortRandom() : shortRandom().toString();
    return genFileKey(this.fileFolder, this.fileName, this.id, this.size);
  }
}

function equalsIgnoringCase(text: string, other: string): boolean {
  return text.localeCompare(other, undefined, { sensitivity: 'base' }) === 0;
}

// function shortenFilePart(fileName: string): string {
//   if (fileName.length > 30) {
//     // shorten file name
//     const extIndex = fileName.lastIndexOf('.');
//     if (extIndex > 0 && extIndex > 30) {
//       const fileExt = fileName.substring(extIndex);
//       fileName = fileName.substring(0, Math.min(fileName.length - fileExt.length, 30));
//       fileName += fileExt;
//     }
//   }
//   return fileName;
// }

/**
 * only allow a-z, 0-9, (), {}, underscore, dash and period
 */
export function normalizeFilePart(item: string): string {
  const normalized = item.trim().replace(/[^a-zA-Z0-9(){}]._-]/g, '-');
  return normalized;
}

export function findFileKeyFromUrls(imageUrls: string[], fileName: string, fileFolder: string): FileKey | undefined {
  fileName = normalizeFilePart(fileName);
  const indexExt = fileName.lastIndexOf('.');
  const nameWithoutExt = encodeURIComponent(indexExt > 0 ? fileName.substring(0, indexExt) : fileName);

  const matchingUrls = imageUrls.filter((url) => url.indexOf(nameWithoutExt) >= 0 && url.indexOf(fileFolder) > 0);
  let matchingFileKey = undefined;
  matchingUrls.forEach((value) => {
    matchingFileKey = new FileKey().parse(value);
    if (fileFolder !== matchingFileKey.fileFolder || fileName !== matchingFileKey.fileName) matchingFileKey = undefined;
  });
  return matchingFileKey;
}

export const extractFileKeyParts = (path: string): (string | null)[] => {
  if (!path) return ['', '', ''];
  if (!process.env.S3_URL_PREFIX) {
    console.error('🔴 S3_URL_PREFIX is not defined.');
    throw new Error('Invalid/Missing environment variable: "S3_URL_PREFIX"');
  }

  let fileFolder = '';
  let fileName = '';
  let uuid = null;
  let size = null;

  let fileKey = decodeURIComponent(path);
  const prefixIndex = fileKey.indexOf(process.env.S3_URL_PREFIX);
  if (prefixIndex >= 0) fileKey = fileKey.substring(prefixIndex + process.env.S3_URL_PREFIX.length + 1);
  const index = fileKey.lastIndexOf('/');
  fileName = index > 0 ? fileKey.substring(index + 1) : fileKey;
  fileFolder = index > 0 ? fileKey.substring(0, index) : '';

  // remove file extension
  const extIndex = fileName.lastIndexOf('.');
  const fileExt = fileName.substring(extIndex);
  fileName = fileName.substring(0, extIndex);

  // work backward, remove size from filename
  const sizeStart = fileName.lastIndexOf(SIZE_PREFIX);
  const sizeEnd = fileName.lastIndexOf(SIZE_SUFFIX);
  if (sizeStart > 0 && sizeEnd > 0) {
    size = fileName.substring(sizeStart + SIZE_PREFIX.length, sizeEnd);
    fileName = fileName.substring(0, sizeStart);
  }

  // work backward, remove uuid from filename
  const objIdStart = fileName.lastIndexOf(ID_PREFIX);
  const objIdEnd = fileName.lastIndexOf(ID_SUFFIX);
  if (objIdStart > 0 && objIdEnd > 0) {
    uuid = fileName.substring(objIdStart + ID_PREFIX.length, objIdEnd);
    fileName = fileName.substring(0, objIdStart);
  }
  fileName += fileExt;
  return [fileFolder, fileName, uuid, size];
};

export const genFileKey = (
  folderName: string,
  fileName: string,
  uuid: string | undefined = undefined,
  size: string | undefined = undefined
): string => {
  // sample output: artistdomain/artpallet(P23453)[xl].jpg
  const fileFolder = folderName ? folderName.trim() : null;
  let fileExt = null;
  const extIndex = fileName.lastIndexOf('.');
  if (extIndex > 0) {
    fileExt = fileName.substring(extIndex);
    fileName = fileName.substring(0, extIndex);
  }
  if (uuid) {
    // Add UUID
    fileName += ID_PREFIX + uuid + ID_SUFFIX;
  }
  if (size) {
    // Add Size
    fileName += SIZE_PREFIX + size + SIZE_SUFFIX;
  }
  if (fileExt) fileName += fileExt;
  fileName = normalizeFilePart(fileName);
  return fileFolder ? `${fileFolder}/${fileName}` : fileName;
};

export const extractRawFilePath = (path: string) => {
  const parts = extractFileKeyParts(path);
  const fileFolder = parts[FOLDER_INDEX];
  const fileName = parts[FILE_INDEX];
  return fileFolder + '/' + fileName;
};

export const isSameFileKey = (path1: string, path2: string): boolean => {
  const key1 = extractRawFilePath(path1);
  const key2 = extractRawFilePath(path2);
  return key1 === key2;
};

export const imageURL = (folderName: string, imageName: string, uuid: string | undefined = undefined, size: string | undefined): string => {
  if (!process.env.S3_URL_PREFIX) {
    console.error('🔴 S3_URL_PREFIX is not defined.');
    throw new Error('Invalid/Missing environment variable: "S3_URL_PREFIX"');
  }
  // sample output: https://artworkprime.s3.us-west-2.amazonaws.com/artistdomain/artpallet(U23840)[xl].jpg
  const theFileKey = genFileKey(folderName, imageName, uuid, size);
  return `${process.env.S3_URL_PREFIX}/${theFileKey}`;
};

/**
 * Upload a file to an S3 bucket.
 */
export const uploadImageFile = async (fileName: string, fileOrBuffer: File | PayloadTypes): Promise<string> =>
  new (Promise as TypedPromiseConstructor<string, Error>)(async (resolve, reject) => {
    if (!process.env.S3_BUCKET) {
      console.error('🔴 S3_BUCKET is not defined.');
      reject(new Error('Invalid/Missing environment variable: "S3_BUCKET"'));
    } else {
      try {
        let imageBuffer = fileOrBuffer instanceof File ? await fileOrBuffer.arrayBuffer() : (fileOrBuffer as PayloadTypes);
        if (imageBuffer instanceof ArrayBuffer) {
          imageBuffer = new Uint8Array(imageBuffer);
        }
        const client = new S3Client({});
        const command = new PutObjectCommand({
          Bucket: process.env.S3_BUCKET,
          Key: fileName,
          Body: imageBuffer,
        });
        await client.send(command);
        const fileUrl = `${process.env.S3_URL_PREFIX}/${fileName}`;
        // console.log(fileUrl);
        resolve(fileUrl);
      } catch (caught) {
        const error = new Error('Error uploading file');
        if (caught instanceof S3ServiceException && caught.name === 'EntityTooLarge') {
          error.cause = `Error from S3 while uploading object to ${process.env.S3_BUCKET}. \
      The object was too large. To upload objects larger than 5GB, use the S3 console (160GB max) \
      or the multipart upload API (5TB max).`;
          console.error(error);
        } else if (caught instanceof S3ServiceException) {
          // error.cause = `Error from S3 while uploading object to ${process.env.S3_BUCKET}.  ${caught.name}: ${caught.message}`;
          console.error(error);
        }
        reject(error);
        throw error;
      }
    }
  });

/**
 * Upload a file to an S3 bucket.
 */
export const uploadImageData = async (
  folderName: string,
  s3FileName: string,
  inputData: string | Uint8Array | Buffer | Readable
): Promise<string> =>
  new (Promise as TypedPromiseConstructor<string, Error>)(async (resolve, reject) => {
    'use server';

    if (!process.env.S3_BUCKET) {
      console.error('🔴 S3_BUCKET is not defined.');
      reject(new Error('Invalid/Missing environment variable: "S3_BUCKET"'));
    } else {
      if (folderName) {
        folderName = folderName.trim();
      }
      if (s3FileName) {
        s3FileName = s3FileName.trim();
      }
      const fileKey = genFileKey(folderName, s3FileName);

      try {
        const client = new S3Client({});
        const command = new PutObjectCommand({
          Bucket: process.env.S3_BUCKET,
          Key: fileKey,
          Body: inputData,
        });
        await client.send(command);
        const fileUrl = `${process.env.S3_URL_PREFIX}/${fileKey}`;
        // console.log(fileUrl);
        resolve(fileUrl);
      } catch (caught) {
        const error = new Error('Error uploading file');
        if (caught instanceof S3ServiceException && caught.name === 'EntityTooLarge') {
          error.cause = `Error from S3 while uploading object to ${process.env.S3_BUCKET}. \
      The object was too large. To upload objects larger than 5GB, use the S3 console (160GB max) \
      or the multipart upload API (5TB max).`;
          console.error(error);
        } else if (caught instanceof S3ServiceException) {
          error.cause = `Error from S3 while uploading object to ${process.env.S3_BUCKET}.  ${caught.name}: ${caught.message}`;
          // console.error(error);
        }
        reject(error);
      }
    }
  });

export const deleteFile = async (fileKey: FileKey): Promise<string> =>
  new (Promise as TypedPromiseConstructor<string, Error>)(async (resolve, reject) => {
    'use server';

    if (!process.env.S3_BUCKET) {
      console.error('🔴 S3_BUCKET is not defined.');
      reject(new Error('Invalid/Missing environment variable: "S3_BUCKET"'));
    } else {
      try {
        const client = new S3Client({});
        const command = new DeleteObjectCommand({
          Bucket: process.env.S3_BUCKET,
          Key: fileKey.toString(),
        });
        await client.send(command);
        resolve(fileKey.toString());
      } catch (caught) {
        const error = new Error('Error uploading file');
        if (caught instanceof S3ServiceException && caught.name === 'EntityTooLarge') {
          error.cause = `Error from S3 while uploading object to ${process.env.S3_BUCKET}. \
        The object was too large. To upload objects larger than 5GB, use the S3 console (160GB max) \
        or the multipart upload API (5TB max).`;
          // console.error(error);
        } else if (caught instanceof S3ServiceException) {
          error.cause = `Error from S3 while uploading object to ${process.env.S3_BUCKET}.  ${caught.name}: ${caught.message}`;
          // console.error(error);
        }
        reject(error);
      }
    }
  });

export const uploadImageFiles = (images: Array<string | File>, domain: string): Map<string, FileKey> => {
  const fileUrlMap = getFileUrlMapping(images, domain, undefined);

  if (images?.length > 0) {
    images.forEach(async (image) => {
      if (image instanceof File) {
        // new file, need to upload image
        const matchingFileKey = fileUrlMap.get(normalizeFilePart(image.name));
        if (!matchingFileKey) {
          console.error('uploadImageFiles: fileKey not found');
        } else {
          const url = await uploadImageFile(matchingFileKey.toString(), image);
          console.log({ url });
        }
      }
    });
  }
  return fileUrlMap;
};

export const removeImages = (fileMap: Map<string, FileKey>): void => {
  fileMap.forEach(async (fileKey) => {
    await deleteFile(fileKey);
  });
};

export const removeOldImages = (newFileMap: Map<string, FileKey>, oldImageUrls: string[]): void => {
  if (oldImageUrls?.length > 0) {
    oldImageUrls.forEach(async (url) => {
      const oldFileKey = new FileKey().parse(url);
      if (!newFileMap.get(oldFileKey.fileName)) {
        // remove files that are no longer referenced in Product or other multiple image object.
        await deleteFile(oldFileKey);
      }
    });
  }
};

export const getFileUrlMapping = (
  images: Array<string | File>,
  domain: string,
  idPrefix: string | undefined,
  size: string | undefined = undefined
): Map<string, FileKey> => {
  const mapping = new Map<string, FileKey>();
  if (images?.length > 0) {
    images.forEach((image) => {
      if (image instanceof File) {
        const newFileKey = new FileKey(domain, image.name, size, idPrefix, true);
        mapping.set(newFileKey.fileName, newFileKey);
      } else if (typeof image === 'string') {
        const fileKey = new FileKey().parse(image as string);
        mapping.set(fileKey.fileName, fileKey);
      }
    });
  }
  return mapping;
};
