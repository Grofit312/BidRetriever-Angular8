import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RemoveSubmissionModalComponent } from './remove-submission-modal.component';

describe('RemoveSubmissionModalComponent', () => {
  let component: RemoveSubmissionModalComponent;
  let fixture: ComponentFixture<RemoveSubmissionModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RemoveSubmissionModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RemoveSubmissionModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
