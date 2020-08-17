import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectSharingComponent } from './project-sharing.component';

describe('ProjectSharingComponent', () => {
  let component: ProjectSharingComponent;
  let fixture: ComponentFixture<ProjectSharingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProjectSharingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectSharingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
