import { Routes } from '@angular/router';
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
  { path: 'dashboard', component: DashboardComponent },
  { path: 'customers', component: CustomersComponent },
  { path: 'deposits', component: DepositsComponent },
  { path: 'reports', component: ReportsComponent },
  { path: 'users', component: UsersComponent },
  { path: 'policies', component: PoliciesComponent },
  { path: 'calculator', component: EmiCalculatorComponent },

  { path: '**', redirectTo: 'login' }
];
