import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SubscriptionSettingsComponent } from './subscription-settings.component';

describe('SubscriptionSettingsComponent', () => {
  let component: SubscriptionSettingsComponent;
  let fixture: ComponentFixture<SubscriptionSettingsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SubscriptionSettingsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SubscriptionSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
