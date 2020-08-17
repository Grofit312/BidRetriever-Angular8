import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RemoveShareModalComponent } from './remove-share-modal.component';

describe('RemoveShareModalComponent', () => {
  let component: RemoveShareModalComponent;
  let fixture: ComponentFixture<RemoveShareModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RemoveShareModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RemoveShareModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
