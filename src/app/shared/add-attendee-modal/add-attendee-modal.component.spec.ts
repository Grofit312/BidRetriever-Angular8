import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddAttendeeModalComponent } from './add-attendee-modal.component';

describe('AddAttendeeModalComponent', () => {
  let component: AddAttendeeModalComponent;
  let fixture: ComponentFixture<AddAttendeeModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddAttendeeModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddAttendeeModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
