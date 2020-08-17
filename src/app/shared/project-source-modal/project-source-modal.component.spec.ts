import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectSourceModalComponent } from './project-source-modal.component';

describe('ProjectSourceModalComponent', () => {
  let component: ProjectSourceModalComponent;
  let fixture: ComponentFixture<ProjectSourceModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProjectSourceModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectSourceModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
