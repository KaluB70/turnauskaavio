import { TestBed } from '@angular/core/testing';

import { WeeklyTournamentService } from './weekly-tournament.service';

describe('WeeklyTournamentService', () => {
  let service: WeeklyTournamentService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WeeklyTournamentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
