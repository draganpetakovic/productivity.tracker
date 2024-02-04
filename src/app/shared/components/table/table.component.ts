import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  computed,
  inject,
  input,
  effect,
} from '@angular/core';
import {
  NgFor,
  NgIf,
  DatePipe,
  DecimalPipe,
  NgTemplateOutlet,
} from '@angular/common';

import { MatTableModule } from '@angular/material/table';
import {
  MatCheckboxChange,
  MatCheckboxModule,
} from '@angular/material/checkbox';

import { TableColumn } from './table-column';
import { BaseEntity } from '../../../core/models/base-entity';
import { MatInputModule } from '@angular/material/input';
import {
  MAT_FORM_FIELD_DEFAULT_OPTIONS,
  MatFormFieldModule,
} from '@angular/material/form-field';
import { DatetimeInputComponent } from '../../ui/datetime-input/datetime-input.component';
import { FormGeneratorService } from '../../../core/services/form-generator.service';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { ReplaySubject, Subject, takeUntil } from 'rxjs';
import { ObjectManipulationService } from '../../../core/services/object-manipulation.service';
import { Dirty } from '../../../core/models/dirty';
import { CheckForUpdatedFieldsPipe } from './pipes/check-for-updated-fields.pipe';

type TableCellValue<T> = { value: T; updatedValue?: T };

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    DatePipe,
    DecimalPipe,
    NgTemplateOutlet,
    MatTableModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    DatetimeInputComponent,
    ReactiveFormsModule,
    CheckForUpdatedFieldsPipe,
  ],
  templateUrl: './table.component.html',
  styleUrl: './table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { appearance: 'outline' },
    },
  ],
})
export class TableComponent<T extends BaseEntity> implements OnDestroy {
  private formGenerator = inject(FormGeneratorService);
  private fb = inject(FormBuilder);
  private objectManipulationService = inject(ObjectManipulationService);

  selectable = input(false);
  rowComparer = input<keyof T>('id');
  columns = input.required<TableColumn[]>();
  data = input.required<T[]>();
  previousUpdates = input<Record<string, Partial<T>>>({});

  @Output() cellValueChange = new EventEmitter<{
    rows: T[];
    updatedFields: Record<string, Partial<T>>;
  }>();
  @Output() rowSelectionChange = new EventEmitter<T[]>();

  updatedData: Record<string, Partial<T>> = {};

  editableColumnsGroup?: FormGroup;
  rowForm: FormGroup = this.fb.group({ data: this.fb.array([]) });

  get rowsData(): FormArray {
    return this.rowForm.get('data') as FormArray;
  }

  displayedColumns = computed(() =>
    this.selectable()
      ? [
          'selection',
          ...this.columns().map((col: TableColumn): string => col.field),
        ]
      : this.columns().map((col: TableColumn): string => col.field)
  );
  editableColumns = computed(() =>
    this.columns().filter((col: TableColumn): boolean =>
      col.type.includes('edit')
    )
  );

  rowSelection = computed(() =>
    !this.selectable
      ? new Map()
      : new Map(
          this.data().map((row: T): [string, boolean] => [
            row[this.rowComparer()] as string,
            false,
          ])
        )
  );

  private selectedRows: T[] = [];
  private unsubscribeForm$ = new Subject<void>();
  private destroy$ = new ReplaySubject<void>(1);

  constructor() {
    effect(() => {
      this.updatedData = this.previousUpdates();
      for (const key in this.updatedData) {
        const row = this.rowsData.value.findIndex(
          (r: T): boolean => r[this.rowComparer()] === key
        );
        if (row > -1) {
          this.rowsData.at(row).patchValue(this.updatedData[key]);
        }
      }
    });
    effect(() => {
      this.rowsData.reset([]);
      if (this.editableColumns().length) {
        this.unsubscribeForm$.next();
        this.rowForm = this.formGenerator.generateFormArray(
          this.data(),
          this.columns(),
          this.rowComparer() as string
        );

        this.rowForm.valueChanges
          .pipe(takeUntil(this.destroy$), takeUntil(this.unsubscribeForm$))
          .subscribe((value: { data: T[] }) => {
            this.updatedData = {};
            const changedRows = value.data.map((formRow: T): T & Dirty => {
              const original = this.data().find(
                (row: T): boolean =>
                  row[this.rowComparer()] === formRow[this.rowComparer()]
              );
              if (!original) {
                return formRow as T & Dirty;
              }
              const changedFields =
                this.objectManipulationService.getChangedFields(
                  formRow,
                  original
                );
              this.updatedData[formRow[this.rowComparer()] as string] =
                changedFields.reduce(
                  (updatedFields: Partial<T>, field: keyof T): Partial<T> => {
                    updatedFields[field] = formRow[field];
                    return updatedFields as Partial<T>;
                  },
                  {}
                );

              return { ...original, ...formRow, dirty: !!changedFields.length };
            });
            this.cellValueChange.emit({
              rows: changedRows,
              updatedFields: this.updatedData,
            });
          });
      }
    });
  }

  onUpdateTableSelection({ checked }: MatCheckboxChange, row: T): void {
    this.rowSelection().set(row[this.rowComparer()] as string, checked);
    this.selectedRows = checked
      ? [...this.selectedRows, row]
      : this.selectedRows.filter((r: T) => r.id !== row.id);
    this.rowSelectionChange.emit(this.selectedRows);
  }

  clearSelection(): void {
    this.rowSelection().forEach((_: boolean, key: string) => {
      this.rowSelection().set(key, false);
    });
    this.selectedRows = [];
    this.rowSelectionChange.emit(this.selectedRows);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.unsubscribeForm$.next();
    this.unsubscribeForm$.complete();
  }
}
