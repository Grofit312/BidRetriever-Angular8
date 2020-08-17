import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentDetailModalComponent } from './document-detail-modal.component';

describe('DocumentDetailModalComponent', () => {
  let component: DocumentDetailModalComponent;
  let fixture: ComponentFixture<DocumentDetailModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DocumentDetailModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DocumentDetailModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
