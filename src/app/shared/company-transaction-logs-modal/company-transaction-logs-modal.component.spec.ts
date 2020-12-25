import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CompanyTransactionLogsModalComponent } from "./company-transaction-logs-modal.component";

describe("CompanyTransactionLogsModalComponent", () => {
  let component: CompanyTransactionLogsModalComponent;
  let fixture: ComponentFixture<CompanyTransactionLogsModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CompanyTransactionLogsModalComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CompanyTransactionLogsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
