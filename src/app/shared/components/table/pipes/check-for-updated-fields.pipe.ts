import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'checkForUpdatedFields',
  standalone: true,
})
export class CheckForUpdatedFieldsPipe implements PipeTransform {
  transform<T>(
    field: string,
    comparer: string,
    updatedData: Record<string, Partial<T>>
  ): boolean {
    return (
      updatedData[comparer] &&
      updatedData[comparer][field as keyof T] !== undefined
    );
  }
}
