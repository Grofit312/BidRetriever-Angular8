import { Routes, RouterModule } from '@angular/router';
import { SignInComponent } from 'app/sign-in/sign-in.component';
import { SignUpComponent } from 'app/sign-up/sign-up.component';
import { ForgotPasswordComponent } from 'app/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from 'app/reset-password/reset-password.component';
import { ChangeCompanyComponent } from 'app/change-company/change-company.component';
import { EmailViewerComponent } from 'app/email-viewer/email-viewer.component';
import { ModuleWithProviders } from '@angular/core';

const routes: Routes = [
  {
    path: 'sign-in',
    component: SignInComponent
  },
  {
    path: 'sign-up',
    component: SignUpComponent
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent
  },
  {
    path: 'reset-password',
    component: ResetPasswordComponent
  },
  {
    path: 'change-company',
    component: ChangeCompanyComponent
  },
  {
    path: 'email-viewer',
    component: EmailViewerComponent
  },
  {
    path: 'customer-portal',
    loadChildren: () => import('./customer-portal/customer-portal.module').then(m => m.CustomerPortalModule)
  },
  {
    path: '**',
    redirectTo: 'customer-portal'
  }
];

export const appRouting: ModuleWithProviders = RouterModule.forRoot(routes);
