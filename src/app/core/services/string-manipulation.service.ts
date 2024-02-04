import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StringManipulationService {
  pluralize<T>(items: T[], word: string): string {
    return items.length > 1 ? `${word}s` : word;
  }
}
