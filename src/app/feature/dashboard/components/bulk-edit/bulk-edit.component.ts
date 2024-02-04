import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  inject,
} from '@angular/core';
import {
  Employee,
  EmployeeForUpdate,
  EmployeeWithShifts,
} from '../../../../shared/models/employee';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { EmployeeDataComponent } from '../employee-data/employee-data.component';
import { MatButtonModule } from '@angular/material/button';
import { Dirty } from '../../../../core/models/dirty';
import { Shift } from '../../../../shared/models/shift';
import { ModalPayload } from '../../../../core/models/modal-payload';
import { ObjectManipulationService } from '../../../../core/services/object-manipulation.service';
import { BaseEntity } from '../../../../core/models/base-entity';

@Component({
  selector: 'app-bulk-edit',
  standalone: true,
  templateUrl: './bulk-edit.component.html',
  styleUrl: './bulk-edit.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmployeeDataComponent, MatButtonModule],
})
export class BulkEditComponent {
  private objectManipulationService = inject(ObjectManipulationService);
  selectedEmployees: EmployeeWithShifts[];
  changedEmployees: EmployeeForUpdate[] = [];
  updatedShiftData: Record<string, Partial<Shift>> = {};

  constructor(
    private dialogRef: MatDialogRef<
      BulkEditComponent,
      ModalPayload<{ employees: EmployeeForUpdate[]; shifts: Partial<Shift>[] }>
    >,
    @Inject(MAT_DIALOG_DATA)
    data: { selectedEmployees: EmployeeWithShifts[] }
  ) {
    this.selectedEmployees = data.selectedEmployees;
  }

  onEmployeeChange(employee: EmployeeForUpdate & Dirty): void {
    this.changedEmployees = this.changedEmployees.filter(
      (e: Partial<Employee> & BaseEntity): boolean => e.id !== employee.id
    );
    if (employee.dirty) {
      this.changedEmployees = [...this.changedEmployees, employee];
    }
  }

  onShiftDataChange(shiftData: Record<string, Partial<Shift>>): void {
    this.updatedShiftData = shiftData;
  }

  onSave(): void {
    const shifts: Partial<Shift>[] = this.objectManipulationService
      .getKeys(this.updatedShiftData)
      .map(
        (key: string): Partial<Shift> => ({
          ...this.updatedShiftData[key],
          id: key,
        })
      );
    this.dialogRef.close({
      type: 'action',
      payload: { employees: this.changedEmployees, shifts },
    });
  }

  onClose(): void {
    this.dialogRef.close({ type: 'cancel' });
  }
}
