import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnalyseDonnees } from './analyse-donnees';

describe('AnalyseDonnees', () => {
  let component: AnalyseDonnees;
  let fixture: ComponentFixture<AnalyseDonnees>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnalyseDonnees]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnalyseDonnees);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
