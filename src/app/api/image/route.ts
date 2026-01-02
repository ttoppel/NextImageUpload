// api/artist/image/

'use server'

import { NextResponse, type NextRequest } from 'next/server';

import ApiResponse, { ApiErrorResponse } from '../../lib/ApiResponse';
import { FileKey, uploadImageFile } from '../../lib/s3Utils';
import { reduceImageSizeToWebp, replaceFileExtension } from '../../lib/fileUtils';

const blobToFile = (blob: Blob, fileName: string, mimeType: string): File => {
  if (blob instanceof File && blob.name === fileName) {
    return blob as File;
  }

  const file: File = new File(
    [blob], // The blob content placed in an array
    fileName,  // The name of the file
    {
      type: mimeType,          // The MIME type
      lastModified: Date.now()     // The last modified date in milliseconds
    }
  );
  return file;
};

const requestBodyToFile = async (req: NextRequest): Promise<File> => {
  // Read the raw body as an ArrayBuffer
  const blob = await req.blob();
  console.error('requestBodyToFile: buffer: ', blob);

  // Convert ArrayBuffer to Node.js Buffer
  // const nodeBuffer = Buffer.from(buffer);
  // const blob = new Blob([nodeBuffer], { type: mimeType });

  // Get filename from a custom header (sent from the client)
  const filename = req.headers.get('x_file_name') || `upload-${Date.now()}`;

  // Get mime type from a custom header (sent from the client)
  const mimeType = req.headers.get('x_mime_type') || 'image/jpeg';

  console.error('requestBodyToFile:', { filename }, { mimeType }, { blob });
  const file = blobToFile(blob, filename, mimeType);
  console.error('requestBodyToFile: file: ', file);
  return file;
};

const processImageUpload = async (req: NextRequest): Promise<ApiResponse> => {
  try {
    const file = await requestBodyToFile(req);
    if (!file) {
      return ApiErrorResponse(400, 'Bad Request: Invalid file data');
    }

    console.error('Image processing about to reduceImageSizeToWebp:', file);
    const reducedBuffer = await reduceImageSizeToWebp(file, 500, 500)
    console.error('Image processing done reduceImageSizeToWebp:', reducedBuffer);

    const fileName = replaceFileExtension(file.name, '.webp');
    const fileKey = new FileKey("testImageUpload", fileName, 'md', undefined, true);

    console.error('Image processing about to upload file:', fileKey);
    const fileUrl = await uploadImageFile(fileKey.toString(), reducedBuffer);
    console.error('Image processing fileUrl:', fileUrl);
    return new ApiResponse(200, { url: fileUrl, fileName }, 'Image uploaded successfully');
  } catch (err) {
    console.error('Image processing failed:', err);
    return ApiErrorResponse(503, `Image processing failed: ${err}`);
  }
};

export async function POST(req: NextRequest) {
  // Upload image
  const apiResponse: ApiResponse = await processImageUpload(req);
  return apiResponse;
}

export async function DELETE(req: NextRequest) {
  return new NextResponse(`Method '${req.method}' not allowed`, { status: 405 });
}

export async function PUT(req: NextRequest) {
  return new NextResponse(`Method '${req.method}' not allowed`, { status: 405 });
}

export async function GET(req: NextRequest) {
  return new NextResponse(`Method '${req.method}' not allowed`, { status: 405 });
}
export async function PATCH(req: NextRequest) {
  return new NextResponse(`Method '${req.method}' not allowed`, { status: 405 });
}
