export interface IApiResponse {
  status?: number;
  success?: boolean;
  payload?: unknown;
  message?: string;
  error?: string | object | unknown;
  fieldErrorMapping?: object | Map<string, string[]>;
}
