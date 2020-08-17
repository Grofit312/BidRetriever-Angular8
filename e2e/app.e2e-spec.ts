import { CustomerPortalPage } from './app.po';

describe('customer-portal App', () => {
  let page: CustomerPortalPage;

  beforeEach(() => {
    page = new CustomerPortalPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
