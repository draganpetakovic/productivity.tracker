import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { HttpRequestOptions } from '../models/http-request';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:3000';

  get<T>(url: string, options: HttpRequestOptions = {}): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}/${url}`, {
      ...options,
    });
  }

  patch<B extends object, R = void>(
    url: string,
    body: B,
    options: HttpRequestOptions = {}
  ): Observable<R> {
    return this.http.patch<R>(`${this.baseUrl}/${url}`, body, {
      ...options,
    });
  }
}
