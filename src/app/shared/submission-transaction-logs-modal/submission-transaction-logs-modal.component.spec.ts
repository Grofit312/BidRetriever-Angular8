import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SubmissionTransactionLogsModalComponent } from './submission-transaction-logs-modal.component';

describe('SubmissionTransactionLogsModalComponent', () => {
  let component: SubmissionTransactionLogsModalComponent;
  let fixture: ComponentFixture<SubmissionTransactionLogsModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SubmissionTransactionLogsModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SubmissionTransactionLogsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
