import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddSubmissionModalComponent } from './add-submission-modal.component';

describe('AddSubmissionModalComponent', () => {
  let component: AddSubmissionModalComponent;
  let fixture: ComponentFixture<AddSubmissionModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddSubmissionModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddSubmissionModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
