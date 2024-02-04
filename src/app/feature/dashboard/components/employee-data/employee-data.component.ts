import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  effect,
  signal,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
} from '@angular/core';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';

import { TableComponent } from '../../../../shared/components/table/table.component';
import {
  EmployeeForUpdate,
  EmployeeUpdateForm,
  EmployeeWithShifts,
} from '../../../../shared/models/employee';
import { TableColumn } from '../../../../shared/components/table/table-column';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Shift } from '../../../../shared/models/shift';
import { DatetimeInputComponent } from '../../../../shared/ui/datetime-input/datetime-input.component';
import { ObjectManipulationService } from '../../../../core/services/object-manipulation.service';
import { ReplaySubject, filter, takeUntil } from 'rxjs';
import { Dirty } from '../../../../core/models/dirty';

@Component({
  selector: 'app-employee-data',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    TableComponent,
    DatetimeInputComponent,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './employee-data.component.html',
  styleUrl: './employee-data.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeDataComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private objectManipulationService = inject(ObjectManipulationService);

  employee = input.required<EmployeeWithShifts>();
  @Output() employeeChange = new EventEmitter<EmployeeForUpdate & Dirty>();
  @Output() updatedShiftData = new EventEmitter<
    Record<string, Partial<Shift>>
  >();

  employeeForm = this.fb.group<EmployeeUpdateForm>({
    id: this.fb.nonNullable.control('', [Validators.required]),
    name: this.fb.nonNullable.control('', [Validators.required]),
    hourlyRate: this.fb.nonNullable.control(0, [Validators.required]),
    hourlyRateOvertime: this.fb.nonNullable.control(0, [Validators.required]),
  });

  dateControl = this.fb.nonNullable.control<Date>(new Date(2023, 0, 20));

  selectedDate = signal(this.dateControl.value);

  columns: TableColumn[] = [
    { title: 'Shift', type: 'text', field: 'id' },
    { title: 'Clock In', type: 'editDatetime', field: 'clockIn' },
    { title: 'Clock Out', type: 'editDatetime', field: 'clockOut' },
    { title: 'Total Hours', type: 'decimal', field: 'totalClockInTime' },
  ];

  updatedShifts: Record<string, Partial<Shift>> = {};

  private destroy$ = new ReplaySubject<void>(1);

  shifts = computed(() => {
    const selectedDatetime = this.selectedDate().getTime();
    const shiftEnd = selectedDatetime + 24 * 60 * 60 * 1000;
    const shifts = this.employee().shifts.filter(
      (shift: Shift): boolean =>
        shift.clockIn >= selectedDatetime && shift.clockIn < shiftEnd
    );

    return shifts;
  });

  constructor() {
    effect(() => {
      this.employeeForm.patchValue({
        id: this.employee().id,
        name: this.employee().name,
        hourlyRate: this.employee().hourlyRate,
        hourlyRateOvertime: this.employee().hourlyRateOvertime,
      });
    });
  }

  ngOnInit(): void {
    this.dateControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((date) => {
        if (date) {
          this.updatedShifts = { ...this.updatedShifts };
          this.selectedDate.set(date);
        }
      });
    this.employeeForm.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        filter(
          (
            formValue: Partial<EmployeeForUpdate>
          ): formValue is EmployeeForUpdate =>
            !!formValue.id &&
            !!formValue.name &&
            !!formValue.hourlyRate &&
            !!formValue.hourlyRateOvertime
        )
      )
      .subscribe((formValue: EmployeeForUpdate): void => {
        const dirty =
          !this.objectManipulationService.checkPartialObjectEquality(
            formValue,
            this.employee()
          );
        this.employeeChange.emit({ ...formValue, dirty });
      });
  }

  onShiftChange({
    updatedFields,
  }: {
    rows: (Shift & Dirty)[];
    updatedFields: Record<string, Partial<Shift>>;
  }): void {
    for (const key in updatedFields) {
      const updatedRowEmpty = !this.objectManipulationService.getKeys(
        updatedFields[key]
      ).length;
      if (this.updatedShifts[key]) {
        if (updatedRowEmpty) {
          delete this.updatedShifts[key];
        } else {
          this.updatedShifts[key] = { ...updatedFields[key] };
        }
      } else {
        if (!updatedRowEmpty) {
          this.updatedShifts[key] = { ...updatedFields[key] };
        }
      }
    }
    for (const key in this.updatedShifts) {
      const shift = this.employee().shifts.find(
        (s: Shift): boolean => s.id === key
      );
      if (shift) {
        this.updatedShifts[key] = {
          ...this.updatedShifts[key],
          employeeId: shift.employeeId,
        };
      }
    }
    this.updatedShiftData.emit(this.updatedShifts);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
