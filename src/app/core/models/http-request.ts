import {
  HttpHeaders,
  HttpContext,
  HttpParams,
  HttpErrorResponse,
} from '@angular/common/http';

export interface HttpRequestOptions {
  headers?:
    | HttpHeaders
    | {
        [header: string]: string | string[];
      };
  context?: HttpContext;
  observe?: 'body';
  params?:
    | HttpParams
    | {
        [param: string]:
          | string
          | number
          | boolean
          | ReadonlyArray<string | number | boolean>;
      };
  reportProgress?: boolean;
  responseType?: 'json';
  withCredentials?: boolean;
}

export type UpdateResponse<T> = {
  payload: T;
  type: 'success' | 'fail';
};
