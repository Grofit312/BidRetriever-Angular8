import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RemoveAttendeeModalComponent } from './remove-attendee-modal.component';

describe('RemoveAttendeeModalComponent', () => {
  let component: RemoveAttendeeModalComponent;
  let fixture: ComponentFixture<RemoveAttendeeModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RemoveAttendeeModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RemoveAttendeeModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
