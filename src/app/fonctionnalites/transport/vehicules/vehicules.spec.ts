import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Vehicules } from './vehicules';

describe('Vehicules', () => {
  let component: Vehicules;
  let fixture: ComponentFixture<Vehicules>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Vehicules]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Vehicules);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
