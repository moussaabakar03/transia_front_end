import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Soumissions } from './soumissions';

describe('Soumissions', () => {
  let component: Soumissions;
  let fixture: ComponentFixture<Soumissions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Soumissions]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Soumissions);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
