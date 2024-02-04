import { Injectable, inject } from '@angular/core';
import { TableColumn } from '../../shared/components/table/table-column';
import { FormBuilder, FormGroup } from '@angular/forms';

@Injectable({
  providedIn: 'root',
})
export class FormGeneratorService {
  private fb = inject(FormBuilder);
  constructor() {}

  generateFormArray<T>(
    rows: T[],
    columns: TableColumn[],
    comparer: string
  ): FormGroup<any> {
    const data = this.fb.array<FormGroup>([]);
    rows.forEach((row: T): void => {
      const rowGroup = this.generateFormGroup(columns, comparer);
      rowGroup.patchValue(row as any);
      data.push(rowGroup);
    });
    return this.fb.group({
      data,
    });
  }

  generateFormGroup(columns: TableColumn[], comparer: string): FormGroup {
    const editableColumns = columns.filter(
      (col: TableColumn): boolean =>
        col.type.includes('edit') || col.field === comparer
    );
    const group = this.fb.group({});
    editableColumns.forEach((col: TableColumn): void => {
      const control = this.fb.control(
        col.type === 'editDatetime' ? new Date() : ''
      );
      group.addControl(col.field, control);
    });
    return group;
  }
}
