import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';
import { Shift, UpdateShiftResponse } from '../../../shared/models/shift';

@Injectable({
  providedIn: 'root',
})
export class ShiftService {
  private apiService = inject(ApiService);

  getShifts(): Observable<Shift[]> {
    return this.apiService.get<Shift[]>('shifts?_sort=start&_order=asc');
  }

  updateShift(shift: Partial<Shift>): Observable<UpdateShiftResponse> {
    return this.apiService
      .patch<Partial<Shift>, UpdateShiftResponse>(`shifts/${shift.id}`, shift)
      .pipe(
        map((): UpdateShiftResponse => ({ type: 'success', payload: shift })),
        catchError(
          (): Observable<UpdateShiftResponse> =>
            of({ type: 'fail', payload: shift })
        )
      );
  }

  updateShifts(shifts: Partial<Shift>[]): Observable<UpdateShiftResponse[]> {
    if (!shifts.length) {
      return of([]);
    }
    return forkJoin(shifts.map((shift) => this.updateShift(shift)));
  }
}
