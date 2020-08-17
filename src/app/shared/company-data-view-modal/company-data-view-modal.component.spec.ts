import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CompanyDataViewModalComponent } from './company-data-view-modal.component';

describe('CompanyDataViewModalComponent', () => {
  let component: CompanyDataViewModalComponent;
  let fixture: ComponentFixture<CompanyDataViewModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CompanyDataViewModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CompanyDataViewModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
