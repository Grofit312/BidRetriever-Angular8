import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { StripeService, Elements, Element as StripeElement, ElementsOptions } from "ngx-stripe";
import { DataStore } from 'app/providers/datastore';

import { NotificationsService } from 'angular2-notifications';
import { SubscriptionSettingsApi } from 'app/customer-portal/system-settings/subscription-settings/subscription-settings.api.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { Logger } from 'app/providers/logger.service';
import { FormBuilder } from '@angular/forms';
const CircularJSON = require('circular-json');

@Component({
  selector: 'app-customer-portal-subscription-settings',
  templateUrl: './subscription-settings.component.html',
  styleUrls: ['./subscription-settings.component.scss'],
  providers: [SubscriptionSettingsApi],
})
export class SubscriptionSettingsComponent implements OnInit {
  elements: Elements;
  card: StripeElement;

  @ViewChild('removeModal', { static:false}) removeModal: ElementRef;
  @ViewChild('cardInputModal', { static:false}) cardInputModal: ElementRef;

  isSysAdmin = false;
  isUpdateMode = false;

  coreProducts = [];
  userToolLicenseProduct = null;
  subscriptionType = '';
  licenseCount = '';
  currentCoreSubscription = null;
  currentLicenseSubscriptions = null;

  cardNumber = '';
  expirationDate = '';
  cvcNumber = '';

  constructor(
    private fb: FormBuilder,
    private stripeService: StripeService,
    public dataStore: DataStore,
    private notificationService: NotificationsService,
    private apiService: SubscriptionSettingsApi,
    private spinner: NgxSpinnerService,
    private loggerService: Logger
  ) { }

  ngOnInit() {
    if (this.dataStore.currentUser) {
      this.initialize();
    } else {
      this.dataStore.authenticationState.subscribe(value => {
        if (value) {
          this.initialize();
        }
      });
    }
  }

  initialize() {
    this.isSysAdmin = this.dataStore.currentUser.user_role === 'sys admin';

    if (this.isSysAdmin) {
      setTimeout(() => this.loadStripeComponent(), 0);
    }

    this.apiService.getProducts()
      .then((products: any[]) => {
        this.coreProducts = products.filter(product => !product.product_name.includes('User Tools'));
        this.userToolLicenseProduct = products.find(product => product.product_name.includes('User Tools'));

        return this.apiService.getSubscriptions(this.dataStore.currentCustomer.customer_id);
      })
      .then((subscriptions: any) => {
        if (!subscriptions) {
          this.cardNumber = this.expirationDate = this.cvcNumber = 'Not Provided';
          return;
        }

        this.currentCoreSubscription = subscriptions.find(subscription => {
          const { subscription_product_id } = subscription;
          const product = this.coreProducts.find(({ product_id, product_name }) => product_id === subscription_product_id
            && !product_name.includes('User Tools'));

          if (product) {
            return true;
          }

          return false;
        });

        if (this.currentCoreSubscription) {
          this.subscriptionType = this.currentCoreSubscription.subscription_product_id;
          this.currentLicenseSubscriptions = subscriptions.filter(({ subscription_product_id }) =>
            subscription_product_id !== this.currentCoreSubscription.subscription_product_id );
        } else {
          this.currentLicenseSubscriptions = subscriptions;
        }

        this.licenseCount = this.currentLicenseSubscriptions.length;

        if (this.isSysAdmin) {
          this.displayObscuredCardInfo();
        } else {
          this.cardNumber = this.expirationDate = this.cvcNumber = 'Not Provided';
        }
      })
      .catch(err => {
        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
      });
  }

  loadStripeComponent() {
    this.apiService.getStripePublishKey()
      .then((key: string) => {
        this.stripeService.setKey(key);

        this.stripeService.elements()
        .subscribe(elements => {
          this.elements = elements;
          if (!this.card) {
            this.card = this.elements.create('card', {
              style: {
                base: {
                  iconColor: '#666EE8',
                  color: '#31325F',
                  lineHeight: '40px',
                  fontWeight: 300,
                  fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
                  fontSize: '18px',
                  '::placeholder': {
                    color: '#CFD7E0'
                  }
                }
              },
              hidePostalCode: true,
            });
            this.card.mount('#card-element');
          }
        });
      })
      .catch(err => {
        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
      });
  }

  getStripeToken() {
    return new Promise((resolve, reject) => {
      this.stripeService
      .createToken(this.card, { name })
      .subscribe(token => {
        if (token.token) {
          resolve(token.token.id);
        } else {
          reject(token.error.message);
        }
      });
    });
  }

  displayObscuredCardInfo() {
    this.apiService.getObscuredCardInfo(this.dataStore.currentUser['customer_id'])
      .then(cardInfo => {
        this.cardNumber = cardInfo['card_number'];
        this.expirationDate = cardInfo['card_expiration_date'];
        this.cvcNumber = cardInfo['cvc_number'];
      })
      .catch(err => {
        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
      });
  }

  onSubscribe() {
    if (!this.subscriptionType) {
      return this.notificationService.error('Error', 'Please select subscription type', { timeOut: 3000, showProgressBar: false });
    }

    if (isNaN(Number(this.licenseCount)) || Number(this.licenseCount) < 0) {
      return this.notificationService.error('Error', 'Please input valid license count', { timeOut: 3000, showProgressBar: false });
    }

    this.cardInputModal.nativeElement.style.display = 'block';
    this.isUpdateMode = false;
  }

  onUpdateSubscription() {
    const licenseCount = Number(this.licenseCount);

    if (isNaN(licenseCount) || licenseCount < 0) {
      this.notificationService.error('Error', 'Please input valid license count', { timeOut: 3000, showProgressBar: false });
    }

    const product = this.coreProducts.find(({ product_id }) => product_id === this.subscriptionType);
    this.spinner.show();

    this.apiService.updateSubscription(this.dataStore.currentUser['customer_id'], this.subscriptionType,
      this.userToolLicenseProduct.product_id, licenseCount)
      .then(res => {
        this.spinner.hide();
        this.notificationService.success('Success', 'Your project plan has been updated', { timeOut: 3000, showProgressBar: false });
        this.logTransaction('Update subscription plan', 'Completed',
          `Updated subscription plan to <${product.product_name}>, license count ${licenseCount}`, 'summary');
      })
      .catch(err => {
        this.spinner.hide();
        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
        this.logTransaction('Update subscription plan', 'Failed', CircularJSON.stringify(err), 'summary');
      });
  }

  onUpdateCardInfo() {
    this.cardInputModal.nativeElement.style.display = 'block';
    this.isUpdateMode = true;
  }

  onSaveCardInfo() {
    this.spinner.show();

    if (this.isUpdateMode) {
      this.getStripeToken()
        .then((token: string) => {
          const { customer_id } = this.dataStore.currentUser;

          return this.apiService.updateBilling(customer_id, token);
        })
        .then(res => {
          this.spinner.hide();
          this.cardInputModal.nativeElement.style.display = 'none';
          this.card.clear();

          this.displayObscuredCardInfo();

          this.notificationService.success('Success', 'Your billing info has been updated', { timeOut: 3000, showProgressBar: false });
          this.logTransaction('Update card info', 'Completed', 'Updated card info', 'summary');
        })
        .catch(err => {
          this.spinner.hide();
          this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
          this.logTransaction('Update card info', 'Failed', CircularJSON.stringify(err), 'summary');
        });
    } else {
      const licenseCount = Number(this.licenseCount);
      const product = this.coreProducts.find(({ product_id }) => product_id === this.subscriptionType);

      this.getStripeToken()
        .then((token: string) => {
          const { user_email, customer_id } = this.dataStore.currentUser;

          return this.apiService.subscribe(customer_id, user_email, token, this.subscriptionType, this.userToolLicenseProduct.product_id, licenseCount);
        })
        .then((res: any) => {
          this.spinner.hide();
          this.cardInputModal.nativeElement.style.display = 'none';
          this.card.clear();

          this.dataStore.currentCustomer.customer_billing_id = 'subscribed';
          this.currentCoreSubscription = { subscription_id: res.subscription_id };
          this.displayObscuredCardInfo();

          this.notificationService.success('Success', 'You have been subscribed', { timeOut: 3000, showProgressBar: false });
          this.logTransaction('Subscribe', 'Completed', `Subscribed to <${product.product_name}>`, 'summary');
        })
        .catch(err => {
          this.spinner.hide();
          this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
          this.logTransaction('Subscribe', 'Failed', CircularJSON.stringify(err), 'summary');
        });
    }
  }

  onCloseCardModal() {
    this.card.clear();
    this.cardInputModal.nativeElement.style.display = 'none';
  }

  onUnsubscribe() {
    this.removeModal.nativeElement.style.display = 'block';
  }

  onCloseUnsubscribeModal() {
    this.removeModal.nativeElement.style.display = 'none';
  }

  onConfirmUnsubscribe() {
    this.removeModal.nativeElement.style.display = 'none';
    this.spinner.show();

    this.apiService.unsubscribe(this.dataStore.currentUser.customer_id)
      .then(res => {
        this.spinner.hide();

        this.dataStore.currentCustomer.customer_billing_id = '';
        this.currentCoreSubscription = null;
        this.currentLicenseSubscriptions = null;
        this.cardNumber = this.expirationDate = this.cvcNumber = 'Not Provided';
        this.licenseCount = '';
        this.subscriptionType = '';

        this.notificationService.success('Success', 'Unsubscribed from project plan', { timeOut: 3000, showProgressBar: false });
        this.logTransaction('Unsubscribe', 'Completed', 'Unsubscribed from project plan', 'summary');
      })
      .catch(err => {
        this.spinner.hide();
        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
        this.logTransaction('Unsubscribe', 'Failed', CircularJSON.stringify(err), 'summary');
      });
  }

  logTransaction(operation: string, status: string, description: string, transaction_level: string) {
    this.loggerService.logAppTransaction({
      routine_name: 'Customer Portal',
      operation_name: operation,
      user_id: this.dataStore.currentUser['user_id'],
      customer_id: this.dataStore.currentUser['customer_id'],
      function_name: operation,
      operation_status: status,
      operation_status_desc: description,
      transaction_level: transaction_level,
    });
  }
}
