import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MainLayoutComponent } from '../../components/layout/main-layout.component';
import { BreadcrumbItem } from '../../components/breadcrumb/breadcrumb.component';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-lic-premium-calculator',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent],
  templateUrl: './lic-premium-calculator.component.html',
  styleUrls: ['./lic-premium-calculator.component.css']
})
export class LicPremiumCalculatorComponent implements OnInit {
  userRole: string = '';
  sidenavCollapsed = false;
  
  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Premium Calculator', active: true }
  ];

  constructor(public languageService: LanguageService) {}

  // Form Data
  calculatorForm = {
    selectedPlan: '',
    age: 25,
    policyTerm: 20,
    basicSumAssured: 500000,
    accidentalDisabilityRider: false,
    accidentalRider: false,
    termRider: false,
    termRiderSumAssured: 0,
    premiumWaiverRider: false,
    proposerAge: 50,
    maturitySettlement: false,
    settlementYears: 3
  };

  // LIC Plans Data (based on Insurance21.in)
  licPlans = [
    { id: '914', name: 'LIC New Endowment Plan (914)', category: 'Endowment' },
    { id: '915', name: 'LIC New Jeevan Anand (915)', category: 'Endowment' },
    { id: '916', name: 'LIC New Bima Bachat (916)', category: 'Endowment' },
    { id: '917', name: 'LIC New Single Premium Endowment (917)', category: 'Single Premium' },
    { id: '920', name: 'LIC New Money Back 20 Years (920)', category: 'Money Back' },
    { id: '921', name: 'LIC New Money Back 25 Years (921)', category: 'Money Back' },
    { id: '933', name: 'LIC Jeevan Lakshya (933)', category: 'Limited Premium' },
    { id: '936', name: 'LIC Jeevan Labh (936)', category: 'Limited Premium' },
    { id: '945', name: 'LIC Jeevan Umang (945)', category: 'Money Back' },
    { id: '850', name: 'LIC Jeevan Shanti Pension Plan (850)', category: 'Pension' },
    { id: '857', name: 'LIC Jeevan Akshay Pension Plan (857)', category: 'Pension' },
    { id: '854', name: 'LIC Tech Term (Online Only) (854)', category: 'Term' },
    { id: '855', name: 'LIC Jeevan Amar Term Plan (855)', category: 'Term' },
    { id: '860', name: 'LIC Bima Jyoti Plan (860)', category: 'Endowment' }
  ];

  // Premium Payment Modes
  paymentModes = [
    { value: 'yearly', label: 'Yearly', rebate: 2 },
    { value: 'halfyearly', label: 'Half Yearly', rebate: 1 },
    { value: 'quarterly', label: 'Quarterly', rebate: 0 },
    { value: 'monthly', label: 'Monthly', rebate: 0 },
    { value: 'single', label: 'Single Premium', rebate: 0 }
  ];

  selectedPaymentMode = 'yearly';

  // Calculation Results
  calculationResults = {
    basicPremium: 0,
    riderPremium: 0,
    totalPremium: 0,
    gst: 0,
    finalPremium: 0,
    breakdown: {
      tabularPremium: 0,
      paymentModeRebate: 0,
      sumAssuredRebate: 0,
      accidentalDisabilityRider: 0,
      accidentalRider: 0,
      termRider: 0,
      premiumWaiverRider: 0
    }
  };

  // Sample Tabular Premium Rates (per 1000 of Sum Assured)
  // Based on Insurance21.in data
  tabularRates: { [key: string]: { [key: number]: number } } = {
    '915': { // Jeevan Anand
      20: 58.45, 25: 61.20, 30: 64.85,
      15: 52.30, 35: 68.90, 40: 74.25
    },
    '914': { // New Endowment
      20: 55.20, 25: 57.80, 30: 61.40,
      15: 49.50, 35: 65.30, 40: 70.80
    },
    '936': { // Jeevan Labh
      20: 62.80, 25: 65.90, 30: 69.60,
      15: 56.20, 35: 73.80, 40: 79.40
    },
    '933': { // Jeevan Lakshya
      20: 68.50, 25: 71.80, 30: 75.90,
      15: 61.40, 35: 80.60, 40: 86.80
    },
    '854': { // Tech Term
      20: 15.20, 25: 16.80, 30: 18.90,
      15: 12.50, 35: 21.40, 40: 24.60
    }
  };

  // Rider Premium Rates (per 1000 of Sum Assured)
  riderRates = {
    accidentalDisability: 2.5,
    accidental: 1.8,
    term: 0.5,
    premiumWaiver: 1.2
  };

  ngOnInit() {
    this.userRole = sessionStorage.getItem('role') || '';
  }

  onSidenavToggle(collapsed: boolean) {
    this.sidenavCollapsed = collapsed;
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  logout() {
    sessionStorage.clear();
    window.location.href = '/login';
  }

  calculatePremium() {
    if (!this.calculatorForm.selectedPlan) {
      alert('Please select a LIC plan');
      return;
    }

    const plan = this.calculatorForm.selectedPlan;
    const age = this.calculatorForm.age;
    const term = this.calculatorForm.policyTerm;
    const sumAssured = this.calculatorForm.basicSumAssured;

    // Get tabular premium rate
    let tabularRate = this.tabularRates[plan]?.[term] || 50; // Default rate if not found

    // Calculate basic premium
    let basicPremium = (sumAssured / 1000) * tabularRate;

    // Apply payment mode rebate
    const paymentMode = this.paymentModes.find(mode => mode.value === this.selectedPaymentMode);
    const paymentRebate = (basicPremium * (paymentMode?.rebate || 0)) / 100;
    basicPremium -= paymentRebate;

    // Apply sum assured rebate (for higher amounts)
    let sumAssuredRebate = 0;
    if (sumAssured >= 1000000) {
      sumAssuredRebate = (basicPremium * 2) / 100; // 2% rebate for 10L+
    } else if (sumAssured >= 500000) {
      sumAssuredRebate = (basicPremium * 1) / 100; // 1% rebate for 5L+
    }
    basicPremium -= sumAssuredRebate;

    // Calculate rider premiums
    let riderPremium = 0;
    let accidentalDisabilityRider = 0;
    let accidentalRider = 0;
    let termRider = 0;
    let premiumWaiverRider = 0;

    if (this.calculatorForm.accidentalDisabilityRider) {
      accidentalDisabilityRider = (sumAssured / 1000) * this.riderRates.accidentalDisability;
      riderPremium += accidentalDisabilityRider;
    }

    if (this.calculatorForm.accidentalRider) {
      accidentalRider = (sumAssured / 1000) * this.riderRates.accidental;
      riderPremium += accidentalRider;
    }

    if (this.calculatorForm.termRider) {
      const termSumAssured = this.calculatorForm.termRiderSumAssured || sumAssured;
      termRider = (termSumAssured / 1000) * this.riderRates.term;
      riderPremium += termRider;
    }

    if (this.calculatorForm.premiumWaiverRider) {
      premiumWaiverRider = (sumAssured / 1000) * this.riderRates.premiumWaiver;
      riderPremium += premiumWaiverRider;
    }

    // Calculate total premium
    const totalPremium = basicPremium + riderPremium;

    // Calculate GST (18%)
    const gst = (totalPremium * 18) / 100;

    // Final premium
    const finalPremium = totalPremium + gst;

    // Update results
    this.calculationResults = {
      basicPremium: Math.round(basicPremium),
      riderPremium: Math.round(riderPremium),
      totalPremium: Math.round(totalPremium),
      gst: Math.round(gst),
      finalPremium: Math.round(finalPremium),
      breakdown: {
        tabularPremium: Math.round((sumAssured / 1000) * tabularRate),
        paymentModeRebate: Math.round(paymentRebate),
        sumAssuredRebate: Math.round(sumAssuredRebate),
        accidentalDisabilityRider: Math.round(accidentalDisabilityRider),
        accidentalRider: Math.round(accidentalRider),
        termRider: Math.round(termRider),
        premiumWaiverRider: Math.round(premiumWaiverRider)
      }
    };
  }

  resetCalculator() {
    this.calculatorForm = {
      selectedPlan: '',
      age: 25,
      policyTerm: 20,
      basicSumAssured: 500000,
      accidentalDisabilityRider: false,
      accidentalRider: false,
      termRider: false,
      termRiderSumAssured: 0,
      premiumWaiverRider: false,
      proposerAge: 50,
      maturitySettlement: false,
      settlementYears: 3
    };
    this.selectedPaymentMode = 'yearly';
    this.calculationResults = {
      basicPremium: 0,
      riderPremium: 0,
      totalPremium: 0,
      gst: 0,
      finalPremium: 0,
      breakdown: {
        tabularPremium: 0,
        paymentModeRebate: 0,
        sumAssuredRebate: 0,
        accidentalDisabilityRider: 0,
        accidentalRider: 0,
        termRider: 0,
        premiumWaiverRider: 0
      }
    };
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  }

  getSelectedPlanDetails() {
    return this.licPlans.find(plan => plan.id === this.calculatorForm.selectedPlan);
  }

  getAgeOptions(): number[] {
    return Array.from({ length: 50 }, (_, i) => i + 15);
  }

  getTermOptions(): number[] {
    return Array.from({ length: 26 }, (_, i) => i + 10);
  }

  getProposerAgeOptions(): number[] {
    return Array.from({ length: 38 }, (_, i) => i + 18);
  }

  getSettlementOptions(): number[] {
    return Array.from({ length: 8 }, (_, i) => i + 2);
  }

  // Helper methods for filtering plans
  getEndowmentPlans() {
    return this.licPlans.filter(p => p.category === 'Endowment');
  }

  getLimitedPremiumPlans() {
    return this.licPlans.filter(p => p.category === 'Limited Premium');
  }

  getMoneyBackPlans() {
    return this.licPlans.filter(p => p.category === 'Money Back');
  }

  getTermPlans() {
    return this.licPlans.filter(p => p.category === 'Term');
  }

  getPensionPlans() {
    return this.licPlans.filter(p => p.category === 'Pension');
  }

  getSinglePremiumPlans() {
    return this.licPlans.filter(p => p.category === 'Single Premium');
  }
}
