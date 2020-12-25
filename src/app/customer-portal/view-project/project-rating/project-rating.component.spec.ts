import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectRatingComponent } from './project-rating.component';

describe('ProjectRatingComponent', () => {
  let component: ProjectRatingComponent;
  let fixture: ComponentFixture<ProjectRatingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProjectRatingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectRatingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
