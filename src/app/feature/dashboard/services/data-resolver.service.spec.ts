import { TestBed } from '@angular/core/testing';

import { DashboardDataService } from './data-resolver.service';

describe('DataResolverService', () => {
  let service: DashboardDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DashboardDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
