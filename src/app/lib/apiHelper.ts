import type { NextApiResponse } from 'next';
import type {IApiResponse} from '../types/types';

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email);
}

export type SetObject = {
  [key: string]: unknown;
};

export interface IApiResponseBody {
  status: number;
  success: boolean;
  message?: string;
  payload?: object;
  error?: string | object | unknown;
  fieldErrorMapping?: SetObject | unknown;
}

export type StringArrayObject = {
  [key: string]: string[];
};


export const toSimpleErrorBody = (error: string | object | unknown): string => toResponseBody(400, undefined, undefined, error, undefined);

export const toSuccessBody = (message?: string, payload?: unknown): string => toResponseBody(200, message, payload, undefined, undefined);

export const toResponseBody = (
  status: number,
  message?: string,
  payload?: unknown,
  error?: string | object | unknown,
  _fieldErrorMapping?: Map<string, string[]>
): string => {
  const fieldErrorMapping = _fieldErrorMapping?.entries ? new Object() as SetObject : undefined;
  if (fieldErrorMapping && _fieldErrorMapping) {
    _fieldErrorMapping.forEach((value, key) => {
      fieldErrorMapping[key] = value;
    });
  }
  const body = JSON.stringify({
    status,
    message,
    success: status >= 200 && status < 207,
    payload,
    error,
    fieldErrorMapping,
  });
  return body;
};

export const applyResponse = (apiResponse: NextApiResponse, status: number, responseBody: IApiResponse = {}): NextApiResponse => {
  responseBody.success = status >= 200 && status < 207 ? true : false;
  responseBody.status = status;
  apiResponse.status(status).json(responseBody);
  apiResponse.setHeader('content-type', 'application/json');
  return apiResponse;
};
