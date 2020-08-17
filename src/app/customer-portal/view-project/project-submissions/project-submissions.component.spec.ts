import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectSubmissionsComponent } from './project-submissions.component';

describe('ProjectSubmissionsComponent', () => {
  let component: ProjectSubmissionsComponent;
  let fixture: ComponentFixture<ProjectSubmissionsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProjectSubmissionsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectSubmissionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
