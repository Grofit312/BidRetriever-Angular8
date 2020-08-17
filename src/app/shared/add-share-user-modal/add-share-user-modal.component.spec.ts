import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddShareUserModalComponent } from './add-share-user-modal.component';

describe('AddShareUserModalComponent', () => {
  let component: AddShareUserModalComponent;
  let fixture: ComponentFixture<AddShareUserModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddShareUserModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddShareUserModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
