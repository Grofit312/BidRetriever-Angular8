import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TransactionLogsModalComponent } from './transaction-logs-modal.component';

describe('TransactionLogsModalComponent', () => {
  let component: TransactionLogsModalComponent;
  let fixture: ComponentFixture<TransactionLogsModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TransactionLogsModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TransactionLogsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
