import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddProjectSourceModalComponent } from './add-project-source-modal.component';

describe('AddProjectSourceModalComponent', () => {
  let component: AddProjectSourceModalComponent;
  let fixture: ComponentFixture<AddProjectSourceModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddProjectSourceModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddProjectSourceModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
