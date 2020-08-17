import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SubmissionDetailModalComponent } from './submission-detail-modal.component';

describe('SubmissionDetailModalComponent', () => {
  let component: SubmissionDetailModalComponent;
  let fixture: ComponentFixture<SubmissionDetailModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SubmissionDetailModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SubmissionDetailModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
