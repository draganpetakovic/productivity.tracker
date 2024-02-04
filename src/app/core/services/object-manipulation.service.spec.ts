import { TestBed } from '@angular/core/testing';

import { ObjectManipulationService } from './object-manipulation.service';

describe('ObjectManipulationService', () => {
  let service: ObjectManipulationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ObjectManipulationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
