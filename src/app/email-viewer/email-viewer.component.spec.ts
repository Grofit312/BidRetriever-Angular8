import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EmailViewerComponent } from './email-viewer.component';

describe('EmailViewerComponent', () => {
  let component: EmailViewerComponent;
  let fixture: ComponentFixture<EmailViewerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EmailViewerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EmailViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
