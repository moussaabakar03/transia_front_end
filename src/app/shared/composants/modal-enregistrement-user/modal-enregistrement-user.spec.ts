import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalEnregistrementUser } from './modal-enregistrement-user';

describe('ModalEnregistrementUser', () => {
  let component: ModalEnregistrementUser;
  let fixture: ComponentFixture<ModalEnregistrementUser>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalEnregistrementUser]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalEnregistrementUser);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
