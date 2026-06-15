import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModaleApercu } from './modale-apercu';

describe('ModaleApercu', () => {
  let component: ModaleApercu;
  let fixture: ComponentFixture<ModaleApercu>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModaleApercu]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModaleApercu);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
