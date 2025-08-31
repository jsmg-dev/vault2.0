import { Component } from '@angular/core';

@Component({
  selector: 'app-emi-calculator',
  templateUrl: './emi-calculator.component.html',
  styleUrls: ['./emi-calculator.component.css']
})
export class EmiCalculatorComponent {
  amount: number = 0;
  rate: number = 0;
  months: number = 0;
  mode: string = 'monthly';

  result: any = null;

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
}
