import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MainLayoutComponent } from '../../components/layout/main-layout.component';
import { NavItem } from '../../components/sidenav/sidenav.component';

@Component({
  selector: 'app-emi-calculator',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MainLayoutComponent],
  templateUrl: './emi-calculator.component.html',
  styleUrls: ['./emi-calculator.component.css']
})
export class EmiCalculatorComponent {
  amount: number = 0;
  rate: number = 0;
  months: number = 0;
  mode: string = 'monthly';  // monthly, yearly, daily
  result: any = null;


  userRole: string = '';
  sidenavCollapsed = false;

  calculateEMI() {
    let emi = 0, n = 0, r = 0;

    if (this.mode === 'monthly') {
      n = this.months;
      r = this.rate / 12 / 100;
    } else if (this.mode === 'yearly') {
      n = this.months / 12;
      r = this.rate / 100;
    } else if (this.mode === 'daily') {
      n = this.months * 30; // approx conversion
      r = this.rate / 365 / 100;
    }

    emi = (this.amount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPayment = emi * n;
    const totalInterest = totalPayment - this.amount;

    this.result = {
      emi: emi.toFixed(2),
      totalPayment: totalPayment.toFixed(2),
      totalInterest: totalInterest.toFixed(2)
    };
  }

  logout() {
    sessionStorage.clear();
    window.location.href = '/login';
  }

  onSidenavToggle(collapsed: boolean) {
    this.sidenavCollapsed = collapsed;
  }
}
