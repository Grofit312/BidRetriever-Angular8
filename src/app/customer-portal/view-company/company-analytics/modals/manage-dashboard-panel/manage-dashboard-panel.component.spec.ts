import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageDashboardPanelComponent } from './manage-dashboard-panel.component';

describe('ManageDashboardPanelComponent', () => {
  let component: ManageDashboardPanelComponent;
  let fixture: ComponentFixture<ManageDashboardPanelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ManageDashboardPanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageDashboardPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
