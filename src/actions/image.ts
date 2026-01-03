'use server';

import type { IApiResponse } from '@/types/types';

const baseUrl = process.env.NEXT_APP_API_URL;

function applyBaseUrl(url: string): string {
  const lowerCaseUrl = url ? url.toString().toLowerCase() : undefined;
  if (lowerCaseUrl && !lowerCaseUrl.startsWith('http')) {
    if (!lowerCaseUrl.startsWith('/')) url = '/' + url;
    url = baseUrl + url;
  }
  return url;
}

export const apiFetcherPost = async (
  url: string,
  body: string | FormData | File | Blob,
  options: RequestInit = { method: 'POST', cache: 'no-cache' }
): Promise<IApiResponse> => {
  let headers = undefined;
  if (body instanceof FormData) {
    // Note: do not specify Content-Type for FormData
    headers = {
      ...options.headers,
    };
  } else if (body instanceof File || body instanceof Blob) {
    const file = body as File;
    headers = {
      'Content-Type': file.type || 'application/octet-stream',
      ...options.headers,
    };
  } else {
    headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
  }

  url = applyBaseUrl(url);
  const requestInit = {
    ...options,
    headers,
    body,
  };
  const response = await fetch(url, requestInit);
  const bodyText = await response.text();
  // Re-parse the body text to JSON
  const jsonBody = bodyText ? JSON.parse(bodyText) : {};
  return jsonBody;
};

export async function imageUploadFile(file: File): Promise<IApiResponse> {
  try {
    const res = await apiFetcherPost('/api/image', file, {
      method: 'POST',
      cache: 'no-cache',
      headers: { x_file_name: file.name, x_mime_type: file.type },
    });
    return res;
  } catch (error) {
    return { success: false, message: 'Image upload failed', error };
  }
}

export async function imageUploadBlob(blob: Blob, fileName: string, mimeType: string): Promise<IApiResponse> {
  try {
    const res = await apiFetcherPost('/api/image', blob, {
      method: 'POST',
      cache: 'no-cache',
      headers: { x_file_name: fileName, x_mime_type: mimeType },
    });
    return res;
  } catch (error) {
    return { success: false, message: 'Image upload failed', error };
  }
}
