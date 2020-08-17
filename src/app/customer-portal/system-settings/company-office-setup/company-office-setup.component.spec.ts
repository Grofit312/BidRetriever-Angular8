import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CompanyOfficeSetupComponent } from './company-office-setup.component';

describe('CompanyOfficeSetupComponent', () => {
  let component: CompanyOfficeSetupComponent;
  let fixture: ComponentFixture<CompanyOfficeSetupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CompanyOfficeSetupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CompanyOfficeSetupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
