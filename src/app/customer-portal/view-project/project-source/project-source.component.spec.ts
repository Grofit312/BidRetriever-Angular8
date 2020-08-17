import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectSourceComponent } from './project-source.component';

describe('ProjectSourceComponent', () => {
  let component: ProjectSourceComponent;
  let fixture: ComponentFixture<ProjectSourceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProjectSourceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectSourceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
