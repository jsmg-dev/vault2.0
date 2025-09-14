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

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard], data: { roles: ['admin', 'user', 'lic'] } },
  { path: 'customers', component: CustomersComponent, canActivate: [authGuard], data: { roles: ['admin', 'user'] } },
  { path: 'deposits', component: DepositsComponent, canActivate: [authGuard], data: { roles: ['admin', 'user'] } },
  { path: 'reports', component: ReportsComponent, canActivate: [authGuard], data: { roles: ['admin', 'user'] } },
  { path: 'users', component: UsersComponent, canActivate: [authGuard], data: { roles: ['admin'] } },
  { path: 'policies', component: PoliciesComponent, canActivate: [authGuard], data: { roles: ['admin', 'user', 'lic'] } },
  { path: 'calculator', component: EmiCalculatorComponent, canActivate: [authGuard], data: { roles: ['admin', 'user'] } },

  { path: '**', redirectTo: 'login' }
];
