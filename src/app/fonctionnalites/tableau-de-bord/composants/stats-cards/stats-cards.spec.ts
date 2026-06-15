import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatsCards } from './stats-cards';

describe('StatsCards', () => {
  let component: StatsCards;
  let fixture: ComponentFixture<StatsCards>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatsCards]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StatsCards);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
