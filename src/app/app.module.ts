import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { HttpClientModule } from "@angular/common/http";
import { DatePipe } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { HashLocationStrategy, LocationStrategy } from "@angular/common";

import { NgxSpinnerModule } from "ngx-spinner";
import { SimpleNotificationsModule } from "angular2-notifications";
import { NgxStripeModule } from "ngx-stripe";
import { TreeModule } from "angular-tree-component";

import { appRouting } from "app/app.routes";
import { AuthenticationGuard } from "app/providers/auth.guard";
import { DataStore } from "app/providers/datastore";
import { AuthApi } from "app/providers/auth.api.service";
import { Logger } from "app/providers/logger.service";
import { AmazonService } from "app/providers/amazon.service";

import { AppComponent } from "./app.component";
import { SignInComponent } from "./sign-in/sign-in.component";
import { SignUpComponent } from "./sign-up/sign-up.component";
import { ForgotPasswordComponent } from "./forgot-password/forgot-password.component";
import { ResetPasswordComponent } from "./reset-password/reset-password.component";
import { ChangeCompanyComponent } from "./change-company/change-company.component";
import { EmailViewerComponent } from "./email-viewer/email-viewer.component";

@NgModule({
  declarations: [
    AppComponent,
    SignInComponent,
    SignUpComponent,
    ForgotPasswordComponent,
    ResetPasswordComponent,
    ChangeCompanyComponent,
    EmailViewerComponent,
  ],
  imports: [
    appRouting,
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,

    BrowserAnimationsModule,
    RouterModule,
    NgxSpinnerModule,
    SimpleNotificationsModule.forRoot(),
    NgxStripeModule.forRoot(window["env"].stripePublishKey),
    TreeModule.forRoot(),
  ],
  providers: [
    AuthenticationGuard,
    DataStore,
    AuthApi,
    AmazonService,
    Logger,
    AmazonService,

    DatePipe,
    { provide: LocationStrategy, useClass: HashLocationStrategy },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
