import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { RemoveCompanyModalComponent } from "./remove-company-modal.component";

describe("RemoveCompanyModalComponent", () => {
  let component: RemoveCompanyModalComponent;
  let fixture: ComponentFixture<RemoveCompanyModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [RemoveCompanyModalComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RemoveCompanyModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
