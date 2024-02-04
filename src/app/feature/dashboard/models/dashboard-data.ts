import { EmployeeWithShifts } from '../../../shared/models/employee';
import { Shift } from '../../../shared/models/shift';

export type DashboardData = {
  employees: EmployeeWithShifts[];
  shifts: Shift[];
};

export type OveralData = {
  totalHours: number;
  regularHoursPaid: number;
  overtimeHoursPaid: number;
};
