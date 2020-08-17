import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SourceSystemAccountsComponent } from './source-system-accounts.component';

describe('SourceSystemAccountsComponent', () => {
  let component: SourceSystemAccountsComponent;
  let fixture: ComponentFixture<SourceSystemAccountsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SourceSystemAccountsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SourceSystemAccountsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
