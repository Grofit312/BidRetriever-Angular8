import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomDatetimeComponent } from './custom-datetime.component';

describe('CustomDatetimeComponent', () => {
  let component: CustomDatetimeComponent;
  let fixture: ComponentFixture<CustomDatetimeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CustomDatetimeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomDatetimeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
