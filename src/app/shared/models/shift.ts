import { UpdateResponse } from '../../core/models/http-request';

export type Shift = {
  id: string;
  employeeId: string;
  clockIn: number;
  clockOut: number;
  totalClockInTime: number;
};

export type UpdateShiftResponse = UpdateResponse<Partial<Shift>>;
