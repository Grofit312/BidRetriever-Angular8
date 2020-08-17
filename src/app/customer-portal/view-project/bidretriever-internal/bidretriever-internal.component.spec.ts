import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BidretrieverInternalComponent } from './bidretriever-internal.component';

describe('BidretrieverInternalComponent', () => {
  let component: BidretrieverInternalComponent;
  let fixture: ComponentFixture<BidretrieverInternalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BidretrieverInternalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BidretrieverInternalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
