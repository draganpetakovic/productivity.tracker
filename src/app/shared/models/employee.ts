import { FormControl } from '@angular/forms';
import { UpdateResponse } from '../../core/models/http-request';
import { Shift, UpdateShiftResponse } from './shift';

export type Employee = {
  id: string;
  name: string;
  email: string;
  hourlyRate: number;
  hourlyRateOvertime: number;
};

export type EmployeeWithShifts = Employee & {
  shifts: Shift[];
  totalClockedInTime: number;
  timeByDay: Map<string, number>;
  regularWorkingHours: number;
  overtimeWorkingHours: number;
  regularHoursPaid: number;
  overtimeHoursPaid: number;
};

export type UpdateEmployeeResponse = UpdateResponse<Partial<Employee>>;

export type BulkUpdateResponse = {
  employees: UpdateEmployeeResponse[];
  shifts: UpdateShiftResponse[];
};

export type WorkingHours = {
  regularWorkingHours: number;
  overtimeWorkingHours: number;
};

export type EmployeeForUpdate = {
  id: string;
  name: string;
  hourlyRate: number;
  hourlyRateOvertime: number;
};

export type EmployeeUpdateForm = {
  [key in keyof EmployeeForUpdate]: FormControl<EmployeeForUpdate[key]>;
};
