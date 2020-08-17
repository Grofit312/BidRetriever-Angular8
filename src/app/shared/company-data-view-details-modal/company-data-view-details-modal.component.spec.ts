import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CompanyDataViewDetailsModalComponent } from './company-data-view-details-modal.component';

describe('CompanyDataViewDetailsModalComponent', () => {
  let component: CompanyDataViewDetailsModalComponent;
  let fixture: ComponentFixture<CompanyDataViewDetailsModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CompanyDataViewDetailsModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CompanyDataViewDetailsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
