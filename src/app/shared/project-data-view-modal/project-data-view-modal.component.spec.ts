import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectDataViewModalComponent } from './project-data-view-modal.component';

describe('ProjectDataViewModalComponent', () => {
  let component: ProjectDataViewModalComponent;
  let fixture: ComponentFixture<ProjectDataViewModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProjectDataViewModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectDataViewModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
