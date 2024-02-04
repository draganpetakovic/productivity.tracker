import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ObjectManipulationService {
  checkObjectEquality<T>(obj1: T, obj2: T): boolean {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  }

  checkPartialObjectEquality<T extends object>(obj1: T, obj2: T): boolean {
    return this.getKeys(obj1).every((key) => obj1[key] === obj2[key]);
  }

  getChangedFields<T extends object>(obj1: T, obj2: T): (keyof T)[] {
    const differentFields: (keyof T)[] = [];

    for (const key in obj1) {
      if (obj1.hasOwnProperty(key) && obj2.hasOwnProperty(key)) {
        const value1 = obj1[key];
        const value2 = obj2[key];
        if (value1 !== value2) {
          differentFields.push(key);
        }
      }
    }

    return differentFields;
  }

  getKeys<T extends object>(obj: T): (keyof T)[] {
    return Object.keys(obj) as (keyof T)[];
  }
}
