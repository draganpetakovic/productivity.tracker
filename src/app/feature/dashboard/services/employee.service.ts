import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';
import {
  BulkUpdateResponse,
  Employee,
  EmployeeWithShifts,
  UpdateEmployeeResponse,
  WorkingHours,
} from '../../../shared/models/employee';
import { ShiftService } from './shift.service';
import { Shift } from '../../../shared/models/shift';
import { DateUtilService } from '../../../core/services/date-util.service';
import { TableColumn } from '../../../shared/components/table/table-column';

@Injectable({
  providedIn: 'root',
})
export class EmployeeService {
  private apiService = inject(ApiService);
  private shiftService = inject(ShiftService);
  private dateUtilService = inject(DateUtilService);

  getEmployees(): Observable<Employee[]> {
    return this.apiService.get<Employee[]>('employees');
  }

  updateEmployee(
    employee: Partial<Employee>
  ): Observable<UpdateEmployeeResponse> {
    return this.apiService
      .patch<Partial<Employee>, UpdateEmployeeResponse>(
        `employees/${employee.id}`,
        employee
      )
      .pipe(
        map(
          (): UpdateEmployeeResponse => ({ type: 'success', payload: employee })
        ),
        catchError((error): Observable<UpdateEmployeeResponse> => {
          return of({
            type: 'fail',
            payload: employee,
          });
        })
      );
  }

  updateEmployees(
    employees: Partial<Employee>[]
  ): Observable<UpdateEmployeeResponse[]> {
    if (!employees.length) {
      return of([]);
    }
    return forkJoin(employees.map((employee) => this.updateEmployee(employee)));
  }

  updateData({
    employees,
    shifts,
  }: {
    employees: Partial<Employee>[];
    shifts: Partial<Shift>[];
  }): Observable<BulkUpdateResponse> {
    return forkJoin({
      employees: this.updateEmployees(employees),
      shifts: this.shiftService.updateShifts(shifts),
    }).pipe();
  }

  getEmployeeShifts(shifts: Shift[], employeeId: string): Shift[] {
    return shifts.filter((s: Shift): boolean => s.employeeId === employeeId);
  }

  mapTotalClockedInTimeToShifts(shifts: Shift[]): Shift[] {
    return shifts.map(
      (shift: Shift): Shift => ({
        ...shift,
        totalClockInTime: (shift.clockOut - shift.clockIn) / 1000 / 60 / 60,
      })
    );
  }

  getWorkedMilisecondsPerDay(shifts: Shift[]): Map<string, number> {
    return shifts.reduce((total: Map<string, number>, shift: Shift): any => {
      const date = this.dateUtilService.parseDate(shift.clockIn);
      const endsOnSameDay = this.dateUtilService.checkDatesForSameDay(
        shift.clockIn,
        shift.clockOut
      );

      if (endsOnSameDay) {
        const hours = this.dateUtilService.getTimeDifference(
          shift.clockIn,
          shift.clockOut
        );
        this.addOrUpdateDateEntry(total, date, hours);
      } else {
        const { startDateTime, endDateTime } =
          this.dateUtilService.getDifferencesForStartAndEndDate(
            shift.clockIn,
            shift.clockOut
          );
        const nextDayDate = this.dateUtilService.parseDate(
          new Date(endDateTime)
        );
        this.addOrUpdateDateEntry(total, date, startDateTime);
        this.addOrUpdateDateEntry(total, nextDayDate, endDateTime);
      }
      return total;
    }, new Map());
  }

  addOrUpdateDateEntry(
    timeByDay: Map<string, number>,
    date: string,
    hours: number
  ) {
    const existingEntry = timeByDay.get(date);
    if (existingEntry) {
      timeByDay.set(date, existingEntry + hours);
    } else {
      timeByDay.set(date, hours);
    }
  }

  calculateRegularAndOvertimeHours(
    timeByDay: Map<string, number>
  ): WorkingHours {
    let regularWorkingHours = 0;
    let overtimeWorkingHours = 0;
    timeByDay.forEach((entry: number): void => {
      const hours = entry / 1000 / 60 / 60;
      if (hours > 8) {
        overtimeWorkingHours += hours - 8;
        regularWorkingHours += 8;
      } else {
        regularWorkingHours += hours;
      }
    });
    return { regularWorkingHours, overtimeWorkingHours };
  }

  mapShiftsToEmployee(employee: Employee, shifts: Shift[]): EmployeeWithShifts {
    const shiftsWithTotalClockedInTime =
      this.mapTotalClockedInTimeToShifts(shifts);
    const totalClockedInTime =
      shiftsWithTotalClockedInTime.reduce(
        (total: number, shift: Shift) => total + shift.clockOut - shift.clockIn,
        0
      ) /
      1000 /
      60 /
      60;
    const timeByDay = this.getWorkedMilisecondsPerDay(
      shiftsWithTotalClockedInTime
    );
    const { regularWorkingHours, overtimeWorkingHours } =
      this.calculateRegularAndOvertimeHours(timeByDay);

    return {
      ...employee,
      totalClockedInTime,
      shifts: shiftsWithTotalClockedInTime,
      timeByDay: this.getWorkedMilisecondsPerDay(shiftsWithTotalClockedInTime),
      regularWorkingHours,
      overtimeWorkingHours,
      regularHoursPaid: employee.hourlyRate * regularWorkingHours,
      overtimeHoursPaid: employee.hourlyRateOvertime * overtimeWorkingHours,
    };
  }

  getEmployeeColumns(): TableColumn[] {
    return [
      {
        field: 'name',
        title: 'Name',
        type: 'text',
      },
      {
        field: 'email',
        title: 'Email',
        type: 'text',
      },
      {
        field: 'totalClockedInTime',
        title: 'Total Clocked In Time',
        type: 'decimal',
      },
      {
        field: 'regularHoursPaid',
        title: 'Regular Pay',
        type: 'decimal',
      },
      {
        field: 'overtimeHoursPaid',
        title: 'Overtime Pay',
        type: 'decimal',
      },
    ];
  }
}
