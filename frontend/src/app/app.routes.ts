import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { LoginComponent } from './pages/login/login.component';
import { CustomersComponent } from './pages/customers/customers.component';
import { DepositsComponent } from './pages/deposits/deposits.component';
import { ReportsComponent } from './pages/reports/reports.component';
import { UsersComponent } from './pages/users/users.component';
import { PoliciesComponent } from './pages/policies/policies.component';
import { EmiCalculatorComponent } from './pages/calculator/emi-calculator.component';
import { LicDashboardComponent } from './pages/lic-dashboard/lic-dashboard.component';
import { LicProductsComponent } from './pages/lic-products/lic-products.component';
import { LicPremiumCalculatorComponent } from './pages/lic-premium-calculator/lic-premium-calculator.component';
import { LaundryComponent } from './pages/laundry/laundry.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard], data: { roles: ['admin', 'user'] } },
  { path: 'lic-dashboard', component: LicDashboardComponent, canActivate: [authGuard], data: { roles: ['admin', 'lic'] } },
  { path: 'lic-products', component: LicProductsComponent, canActivate: [authGuard], data: { roles: ['admin', 'user', 'lic'] } },
  { path: 'lic-premium-calculator', component: LicPremiumCalculatorComponent, canActivate: [authGuard], data: { roles: ['admin', 'user', 'lic'] } },
  { path: 'customers', component: CustomersComponent, canActivate: [authGuard], data: { roles: ['admin', 'user'] } },
  { path: 'deposits', component: DepositsComponent, canActivate: [authGuard], data: { roles: ['admin', 'user'] } },
  { path: 'reports', component: ReportsComponent, canActivate: [authGuard], data: { roles: ['admin', 'user'] } },
  { path: 'users', component: UsersComponent, canActivate: [authGuard], data: { roles: ['admin'] } },
  { path: 'policies', component: PoliciesComponent, canActivate: [authGuard], data: { roles: ['admin', 'user', 'lic'] } },
  { path: 'calculator', component: EmiCalculatorComponent, canActivate: [authGuard], data: { roles: ['admin', 'user'] } },
  { path: 'laundry', component: LaundryComponent, canActivate: [authGuard], data: { roles: ['admin', 'user', 'laundry'] } },

  { path: '**', redirectTo: 'login' }
];
