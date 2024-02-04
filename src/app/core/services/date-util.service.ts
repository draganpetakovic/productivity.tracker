import { Injectable } from '@angular/core';
import e from 'express';

@Injectable({
  providedIn: 'root',
})
export class DateUtilService {
  parseDate(date: Date | number): string {
    const d = new Date(date);
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  getTimeDifference(start: number, end: number): number {
    return end - start;
  }

  getDifferencesForStartAndEndDate(
    start: number,
    end: number
  ): { startDateTime: number; endDateTime: number } {
    const endMidnight = this.calculateMidnight(end);
    const startDateTime = this.getTimeDifference(start, endMidnight);
    const endDateTime = this.getTimeDifference(endMidnight, end);

    return {
      startDateTime,
      endDateTime,
    };
  }

  // getHoursWorkedPerDay(shift: Shift): any {
  //   return shift.clockOut - shift.clockIn;
  // }

  calculateMidnight(timestamp: number): number {
    const date = new Date(timestamp);

    date.setHours(0, 0, 0, 0);

    const midnightTimestamp = date.getTime();

    return midnightTimestamp;
  }

  checkDatesForSameDay(start: number, end: number): boolean {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return startDate.getDate() === endDate.getDate();
  }

  // checkIfShiftEndsOnNextDay(shift: Shift): boolean {
  //   const startDate = new Date(shift.clockIn);
  //   const endDate = new Date(shift.clockOut);
  //   return startDate.getDate() !== endDate.getDate();
  // }
}
