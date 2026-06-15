import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Villes } from './villes';

describe('Villes', () => {
  let component: Villes;
  let fixture: ComponentFixture<Villes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Villes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Villes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
