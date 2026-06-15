import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormulairesDeployes } from './formulaires-deployes';

describe('FormulairesDeployes', () => {
  let component: FormulairesDeployes;
  let fixture: ComponentFixture<FormulairesDeployes>;
  
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormulairesDeployes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormulairesDeployes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
