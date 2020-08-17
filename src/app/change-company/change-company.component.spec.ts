import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangeCompanyComponent } from './change-company.component';

describe('ChangeCompanyComponent', () => {
  let component: ChangeCompanyComponent;
  let fixture: ComponentFixture<ChangeCompanyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChangeCompanyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChangeCompanyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
