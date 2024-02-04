import {
  ChangeDetectionStrategy,
  Component,
  Signal,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { EmployeeService } from './services/employee.service';
import { TableColumn } from '../../shared/components/table/table-column';
import { TableComponent } from '../../shared/components/table/table.component';
import {
  BulkUpdateResponse,
  Employee,
  EmployeeWithShifts,
  UpdateEmployeeResponse,
} from '../../shared/models/employee';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { BulkEditComponent } from './components/bulk-edit/bulk-edit.component';
import { ModalPayload } from '../../core/models/modal-payload';
import { Shift, UpdateShiftResponse } from '../../shared/models/shift';
import { ActivatedRoute, Data } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { take } from 'rxjs';
import { OveralData } from './models/dashboard-data';
import { StringManipulationService } from '../../core/services/string-manipulation.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DecimalPipe, TableComponent, MatButtonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private employeeService = inject(EmployeeService);
  private dialog = inject(MatDialog);
  private snackbar = inject(MatSnackBar);
  private stringManipulationService = inject(StringManipulationService);

  @ViewChild(TableComponent) table!: TableComponent<Employee>;

  employeeColumns: TableColumn[] = this.employeeService.getEmployeeColumns();
  selectedEmployees: Employee[] = [];

  data = signal<EmployeeWithShifts[]>([]);

  totalShifts = 0;

  overalData: Signal<OveralData> = computed(() => {
    return this.data().reduce(
      (total: any, employee: EmployeeWithShifts): OveralData => {
        total.regularHoursPaid += employee.regularHoursPaid;
        total.overtimeHoursPaid += employee.overtimeHoursPaid;
        total.totalHours += employee.totalClockedInTime;
        return total;
      },
      { totalHours: 0, regularHoursPaid: 0, overtimeHoursPaid: 0 }
    );
  });

  constructor(route: ActivatedRoute) {
    route.data.pipe(take(1)).subscribe(({ data }: Data) => {
      this.data.set(data.employees);
      this.totalShifts = data.shifts.length;
    });
  }

  onTableSelectionChange(employees: Employee[]): void {
    this.selectedEmployees = employees;
  }

  onBulkEdit(): void {
    const dialogRef = this.dialog.open(BulkEditComponent, {
      data: { selectedEmployees: this.selectedEmployees },
    });
    dialogRef.afterClosed().subscribe(
      (
        result: ModalPayload<{
          employees: Employee[];
          shifts: Partial<Shift>[];
        }>
      ): void => {
        if (result?.type === 'action') {
          this.employeeService
            .updateData(result.payload)
            .subscribe((res: BulkUpdateResponse): void => {
              const updatedEmployees = res.employees.filter(
                (employeeResponse: any): boolean =>
                  employeeResponse.type === 'success'
              );
              const updatedShifts = res.shifts.filter(
                (shiftResponse: UpdateShiftResponse): boolean =>
                  shiftResponse.type === 'success'
              );
              this.data.update(
                (employees: EmployeeWithShifts[]): EmployeeWithShifts[] =>
                  this.refreshData(employees, updatedEmployees, updatedShifts)
              );

              const message = this.generateUpdateMessage(
                updatedEmployees,
                updatedShifts
              );
              this.snackbar.open(message, 'X', { duration: 2000 });
            });
        }
        this.table.clearSelection();
      }
    );
  }

  refreshData(
    employees: EmployeeWithShifts[],
    updatedEmployees: UpdateEmployeeResponse[],
    updatedShifts: UpdateShiftResponse[]
  ): EmployeeWithShifts[] {
    return employees.map((employee: EmployeeWithShifts): EmployeeWithShifts => {
      const updatedEmployee = updatedEmployees.find(
        (e: any): boolean => e.payload.id === employee.id
      );
      const updatedEmployeeShifts = updatedShifts.filter(
        (shift: UpdateShiftResponse): boolean =>
          shift.payload.employeeId === employee.id
      );

      if (!updatedEmployee && !updatedEmployeeShifts.length) {
        return employee;
      }
      if (updatedEmployee) {
        const newEmployee = {
          ...employee,
          ...updatedEmployee.payload,
        };
        if (updatedEmployeeShifts.length) {
          return this.updateShiftsAndMapEmployee(
            newEmployee,
            updatedEmployeeShifts
          );
        } else {
          return this.employeeService.mapShiftsToEmployee(
            newEmployee,
            newEmployee.shifts
          );
        }
      } else {
        return this.updateShiftsAndMapEmployee(employee, updatedEmployeeShifts);
      }
    });
  }

  updateShiftsAndMapEmployee(
    employee: EmployeeWithShifts,
    shifts: UpdateShiftResponse[]
  ): EmployeeWithShifts {
    const newShifts = this.updateShiftsForEmployee(employee, shifts);
    return this.employeeService.mapShiftsToEmployee(employee, newShifts);
  }

  updateShiftsForEmployee(
    employee: EmployeeWithShifts,
    updatedShifts: UpdateShiftResponse[]
  ): Shift[] {
    return employee.shifts.map((shift: Shift): Shift => {
      const updatedShift = updatedShifts.find(
        (s: UpdateShiftResponse): boolean => s.payload.id === shift.id
      );
      return updatedShift ? { ...shift, ...updatedShift.payload } : shift;
    });
  }

  generateUpdateMessage(
    updatedEmployees: UpdateEmployeeResponse[],
    updatedShifts: UpdateShiftResponse[]
  ): string {
    if (!updatedEmployees.length && !updatedShifts.length) {
      return 'No updates';
    } else if (!updatedEmployees.length) {
      return `Successfully updated ${
        updatedShifts.length
      } ${this.stringManipulationService.pluralize(updatedShifts, 'shift')}`;
    } else if (!updatedShifts.length) {
      return `Successfully updated ${
        updatedEmployees.length
      } ${this.stringManipulationService.pluralize(
        updatedEmployees,
        'employee'
      )}`;
    } else {
      return `Successfully updated ${
        updatedEmployees.length
      } ${this.stringManipulationService.pluralize(
        updatedEmployees,
        'employee'
      )} and ${updatedShifts.length} ${this.stringManipulationService.pluralize(
        updatedShifts,
        'shift'
      )}`;
    }
  }
}
