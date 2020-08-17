import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DestinationSystemSettingsComponent } from './destination-system-settings.component';

describe('DestinationSystemSettingsComponent', () => {
  let component: DestinationSystemSettingsComponent;
  let fixture: ComponentFixture<DestinationSystemSettingsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DestinationSystemSettingsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DestinationSystemSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
