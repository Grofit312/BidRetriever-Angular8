import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicShareModalComponent } from './public-share-modal.component';

describe('PublicShareModalComponent', () => {
  let component: PublicShareModalComponent;
  let fixture: ComponentFixture<PublicShareModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PublicShareModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PublicShareModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
