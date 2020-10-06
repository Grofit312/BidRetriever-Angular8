import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MySettingsMenuComponent } from './my-settings-menu.component';

describe('MySettingsMenuComponent', () => {
  let component: MySettingsMenuComponent;
  let fixture: ComponentFixture<MySettingsMenuComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MySettingsMenuComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MySettingsMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
