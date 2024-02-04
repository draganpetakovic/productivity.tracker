import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  forwardRef,
  inject,
  ViewChild,
  ElementRef,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormBuilder,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-datetime-input',
  standalone: true,
  imports: [MatInputModule, ReactiveFormsModule, DatePipe],
  templateUrl: './datetime-input.component.html',
  styleUrl: './datetime-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatetimeInputComponent),
      multi: true,
    },
  ],
})
export class DatetimeInputComponent implements ControlValueAccessor {
  private fb = inject(FormBuilder);

  @Input()
  set value(date: Date | number) {
    this.timeForm.patchValue(this.getFormValue(date));
    this.currentDate = new Date(date);
  }
  @ViewChild('hoursInput') hoursInput!: ElementRef<HTMLInputElement>;
  @ViewChild('minutesInput') minutesInput!: ElementRef<HTMLInputElement>;

  timeForm = this.fb.group({
    hours: this.fb.nonNullable.control(''),
    minutes: this.fb.nonNullable.control(''),
  });

  currentDate = new Date();

  onTouched?: () => void;
  onChange?: (timestamp: number) => void;

  writeValue(date: Date | number): void {
    if (date) {
      this.timeForm.patchValue(this.getFormValue(date));
      this.currentDate = new Date(date);
    }
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  setDisabledState?(isDisabled: boolean): void {
    isDisabled ? this.timeForm.disable() : this.timeForm.enable();
  }

  getFormValue(date: Date | number): { hours: string; minutes: string } {
    return {
      hours: new Date(date).getHours().toString().padStart(2, '0'),
      minutes: new Date(date).getMinutes().toString().padStart(2, '0'),
    };
  }

  onHoursBlur(): void {
    const hours = (this.timeForm.get('hours')?.value || '00')
      .toString()
      .padStart(2, '0');
    if (!hours || +hours > 23) {
      this.timeForm.get('hours')?.setValue('00');
    } else {
      this.timeForm.get('hours')?.setValue(hours);
    }
    this.currentDate.setHours(+hours);
    this.onTouched && this.onTouched();
    this.onChange && this.onChange(this.currentDate.getTime());
  }

  onMinutesBlur(): void {
    const minutes = (this.timeForm.get('minutes')?.value || '00')
      .toString()
      .padStart(2, '0');
    if (+minutes > 59) {
      this.timeForm.get('minutes')?.setValue('00');
    } else {
      this.timeForm.get('minutes')?.setValue(minutes);
    }
    this.currentDate.setMinutes(+minutes);
    this.onTouched && this.onTouched();
    this.onChange && this.onChange(this.currentDate.getTime());
  }
}
