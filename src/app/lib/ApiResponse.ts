import { toResponseBody } from './apiHelper';
import type { NextApiResponse } from 'next';

import { NextResponse } from 'next/server';

const applyNextApiResponse = (resp: NextResponse, nextApiResp: NextApiResponse | undefined) => {
  if (nextApiResp)
    // set headers from apiResponse
    nextApiResp.getHeaderNames().forEach((name) => {
      if (name) {
        const value = nextApiResp.getHeader(name);
        if (value) resp.headers.set(name, value.toString());
      }
    });
};
class ApiResponse extends NextResponse {
  constructor (
    status: number,
    payload?: unknown,
    message?: string,
    error?: string | object | unknown,
    fieldErrorMapping?: Map<string, string[]>,
    apiResponse?: NextApiResponse
  ) {
     if (error instanceof Object && 'message' in error) {
      const msg = error['message'] as string;
      error = message = msg;
    }

    const body = toResponseBody(status, message, payload, error, fieldErrorMapping);
    super(body, { status, headers: [['content-type', 'application/json']] });
    applyNextApiResponse(this, apiResponse);
  }
}

export const ApiErrorResponse = (
  status: number,
  error?: string | object | unknown,
  fieldErrorMapping?: Map<string, string[]>,
  apiResponse?: NextApiResponse
): ApiResponse => new ApiResponse(status, undefined, undefined, error, fieldErrorMapping, apiResponse);

export default ApiResponse;
