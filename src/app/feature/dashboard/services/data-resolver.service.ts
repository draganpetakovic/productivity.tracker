import { Injectable, inject } from '@angular/core';
import { EmployeeService } from './employee.service';
import { Observable, forkJoin, map } from 'rxjs';
import { Employee, EmployeeWithShifts } from '../../../shared/models/employee';
import { Shift } from '../../../shared/models/shift';
import { ShiftService } from './shift.service';
import { DashboardData } from '../models/dashboard-data';
import { ResolveFn } from '@angular/router';

export const dashboardDataResolver: ResolveFn<DashboardData> = () => {
  const dataResolverService = inject(DashboardDataService);
  return dataResolverService.getData();
};

@Injectable({
  providedIn: 'root',
})
export class DashboardDataService {
  private employeeService = inject(EmployeeService);
  private shiftsService = inject(ShiftService);

  getData(): Observable<DashboardData> {
    return forkJoin({
      employees: this.employeeService.getEmployees(),
      shifts: this.shiftsService.getShifts(),
    }).pipe(
      map(
        ({
          employees,
          shifts,
        }: {
          employees: Employee[];
          shifts: Shift[];
        }): DashboardData => ({
          shifts,
          employees: employees.map(
            (employee: Employee): EmployeeWithShifts =>
              this.employeeService.mapShiftsToEmployee(
                employee,
                this.employeeService.getEmployeeShifts(shifts, employee.id)
              )
          ),
        })
      )
    );
  }
}
