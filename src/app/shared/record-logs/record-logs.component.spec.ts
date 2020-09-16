import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RecordLogsComponent } from './record-logs.component';

describe('RecordLogsComponent', () => {
  let component: RecordLogsComponent;
  let fixture: ComponentFixture<RecordLogsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RecordLogsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RecordLogsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
