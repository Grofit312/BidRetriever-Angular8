import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CompanyNotesComponent } from './company-notes.component';

describe('CompanyNotesComponent', () => {
  let component: CompanyNotesComponent;
  let fixture: ComponentFixture<CompanyNotesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CompanyNotesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CompanyNotesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
