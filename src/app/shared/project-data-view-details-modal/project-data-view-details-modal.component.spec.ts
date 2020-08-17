import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectDataViewDetailsModalComponent } from './project-data-view-details-modal.component';

describe('ProjectDataViewDetailsModalComponent', () => {
  let component: ProjectDataViewDetailsModalComponent;
  let fixture: ComponentFixture<ProjectDataViewDetailsModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProjectDataViewDetailsModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectDataViewDetailsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
