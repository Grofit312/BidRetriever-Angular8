import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { SignInComponent } from './sign-in/sign-in.component';
import { appRouting } from 'app/app.routes';import { AuthenticationGuard } from 'app/providers/auth.guard';
import { SimpleNotificationsModule } from 'angular2-notifications';
import { NgxSpinnerModule } from 'ngx-spinner';
import { DataStore } from 'app/providers/datastore';
import { SignUpComponent } from './sign-up/sign-up.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { ChangeCompanyComponent } from './change-company/change-company.component';
import { EmailViewerComponent } from './email-viewer/email-viewer.component';
import { NgxStripeModule } from 'ngx-stripe';
import { AuthApi } from 'app/providers/auth.api.service';
import { Logger } from 'app/providers/logger.service';
import { AmazonService } from 'app/providers/amazon.service';
import { RouterModule } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TreeModule } from 'angular-tree-component';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';

@NgModule({
  declarations: [
    AppComponent,
    SignInComponent,
    SignUpComponent,
    ForgotPasswordComponent,
    ResetPasswordComponent,
    ChangeCompanyComponent,
    EmailViewerComponent
  ],
  imports: [
    appRouting,
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    RouterModule,
    NgxSpinnerModule,
    SimpleNotificationsModule.forRoot(),
    NgxStripeModule.forRoot(window['env'].stripePublishKey),
    TreeModule.forRoot()
  ],
  providers: [
    AuthenticationGuard,
    DataStore,
    AuthApi,
    AmazonService,
    Logger,
    AmazonService,
    {provide: LocationStrategy, useClass: HashLocationStrategy}
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
