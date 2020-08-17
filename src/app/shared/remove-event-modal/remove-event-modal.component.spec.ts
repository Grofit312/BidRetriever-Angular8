import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RemoveEventModalComponent } from './remove-event-modal.component';

describe('RemoveEventModalComponent', () => {
  let component: RemoveEventModalComponent;
  let fixture: ComponentFixture<RemoveEventModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RemoveEventModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RemoveEventModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
