import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MainLayoutComponent } from '../../components/layout/main-layout.component';
import { BreadcrumbItem } from '../../components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-lic-products',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent],
  templateUrl: './lic-products.component.html',
  styleUrls: ['./lic-products.component.css']
})
export class LicProductsComponent implements OnInit {
  userRole: string = '';
  sidenavCollapsed = false;
  
  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'LIC Products', active: true }
  ];

  selectedCategory = 'all';
  searchTerm = '';

  // Product categories based on LIC website
  categories = [
    { id: 'all', name: 'All Products', icon: 'fas fa-list' },
    { id: 'endowment', name: 'Endowment Plans', icon: 'fas fa-piggy-bank' },
    { id: 'whole-life', name: 'Whole Life Plans', icon: 'fas fa-infinity' },
    { id: 'money-back', name: 'Money Back Plans', icon: 'fas fa-money-bill-wave' },
    { id: 'term', name: 'Term Assurance Plans', icon: 'fas fa-shield-alt' },
    { id: 'pension', name: 'Pension Plans', icon: 'fas fa-user-clock' },
    { id: 'unit-linked', name: 'Unit Linked Plans', icon: 'fas fa-chart-line' },
    { id: 'micro', name: 'Micro Insurance Plans', icon: 'fas fa-hand-holding-heart' }
  ];

  // LIC Products based on official website with comprehensive details
  products = [
    // New Products (Featured)
    {
      id: 'tech-term',
      name: 'New Tech Term',
      category: 'term',
      type: 'New Product',
      description: 'Choose between Level Sum Assured and Increasing Sum Assured. Flexible premium options (Single, Regular, Limited), policy term, and the choice to receive benefits in instalments.',
      features: [
        'Level or Increasing Sum Assured',
        'Flexible premium options',
        'Single/Regular/Limited premium',
        'Flexible policy term',
        'Benefit in instalments option'
      ],
      minAge: 18,
      maxAge: 65,
      minTerm: 5,
      maxTerm: 40,
      minSumAssured: 100000,
      maxSumAssured: 25000000,
      minPremium: 5000,
      maxPremium: 500000,
      premiumPaymentTerm: 'Single, Regular, Limited',
      modeOfPayment: 'Yearly, Half-yearly, Quarterly, Monthly',
      policyTerm: '5 to 40 years',
      maturityBenefit: 'Sum Assured on Maturity + Vested Bonus',
      deathBenefit: 'Sum Assured on Death + Vested Bonus',
      loanAvailable: false,
      surrenderValue: 'After 3 years',
      revivalPeriod: '2 years',
      gracePeriod: '30 days',
      taxBenefit: 'Section 80C & 10(10D)',
      medicalExamination: 'Required for Sum Assured > 25 Lakhs',
      buyOnline: true,
      isNew: true,
      additionalInfo: {
        riders: ['Accidental Death Benefit', 'Premium Waiver Benefit'],
        exclusions: 'Suicide within 12 months',
        specialFeatures: 'High Sum Assured Rebate available',
        claimSettlementRatio: '99.73%'
      }
    },
    {
      id: 'jeevan-utsav',
      name: 'Jeevan Utsav',
      category: 'endowment',
      type: 'New Product',
      description: 'Guaranteed annual payout of 10% of Sum Assured starts 3-6 years after premium payment term, ensuring lifelong financial security.',
      features: [
        '10% guaranteed annual payout',
        'Lifelong financial security',
        'Guaranteed additions',
        'Whole life insurance',
        'Limited premium payment term (5-16 years)'
      ],
      minAge: 18,
      maxAge: 65,
      minTerm: 10,
      maxTerm: 25,
      minSumAssured: 200000,
      maxSumAssured: 10000000,
      minPremium: 12000,
      maxPremium: 600000,
      premiumPaymentTerm: 'Limited (5-16 years)',
      modeOfPayment: 'Yearly, Half-yearly, Quarterly, Monthly',
      policyTerm: '10 to 25 years',
      maturityBenefit: 'Sum Assured + Guaranteed Additions',
      deathBenefit: 'Sum Assured + Guaranteed Additions',
      loanAvailable: true,
      surrenderValue: 'After 3 years',
      revivalPeriod: '2 years',
      gracePeriod: '30 days',
      taxBenefit: 'Section 80C & 10(10D)',
      medicalExamination: 'Required for Sum Assured > 25 Lakhs',
      buyOnline: true,
      isNew: true,
      additionalInfo: {
        riders: ['Accidental Death Benefit', 'Premium Waiver Benefit', 'Term Rider'],
        exclusions: 'Suicide within 12 months',
        specialFeatures: 'Guaranteed annual payout for life',
        claimSettlementRatio: '99.73%',
        bonusRate: 'Guaranteed additions @ ₹50 per 1000 SA per year'
      }
    },
    {
      id: 'amritbal',
      name: 'Amritbal',
      category: 'endowment',
      type: 'New Product',
      description: 'Attractive guaranteed additions offered throughout the policy term for consistent growth. Maturity age options between 18-25 years.',
      features: [
        'Attractive guaranteed additions',
        'Consistent growth',
        'Maturity age 18-25 years',
        'Single/Limited premium payment',
        'Child future planning'
      ],
      minAge: 0,
      maxAge: 12,
      minTerm: 15,
      maxTerm: 20,
      minSumAssured: 100000,
      maxSumAssured: 5000000,
      minPremium: 6000,
      maxPremium: 300000,
      premiumPaymentTerm: 'Single or Limited (5-10 years)',
      modeOfPayment: 'Yearly, Half-yearly, Quarterly, Monthly',
      policyTerm: '15 to 20 years',
      maturityBenefit: 'Sum Assured + Guaranteed Additions',
      deathBenefit: 'Sum Assured + Guaranteed Additions',
      loanAvailable: true,
      surrenderValue: 'After 3 years',
      revivalPeriod: '2 years',
      gracePeriod: '30 days',
      taxBenefit: 'Section 80C & 10(10D)',
      medicalExamination: 'Not required for child',
      buyOnline: true,
      isNew: true,
      additionalInfo: {
        riders: ['Premium Waiver Benefit', 'Accidental Death Benefit'],
        exclusions: 'Suicide within 12 months',
        specialFeatures: 'Child plan with guaranteed additions',
        claimSettlementRatio: '99.73%',
        bonusRate: 'Guaranteed additions @ ₹40 per 1000 SA per year'
      }
    },
    {
      id: 'digi-term',
      name: 'Digi Term',
      category: 'term',
      type: 'New Product',
      description: 'Flexibility to choose Level Sum Assured / Increasing Sum Assured with benefit of Attractive High Sum Assured Rebate.',
      features: [
        'Level/Increasing Sum Assured',
        'High Sum Assured Rebate',
        'Digital purchase process',
        'Flexible premium options',
        'Online policy management'
      ],
      buyOnline: true,
      isNew: true
    },
    {
      id: 'cancer-cover',
      name: 'Cancer Cover',
      category: 'term',
      type: 'Health Insurance',
      description: 'Cancer Cover is a Regular Premium, Non-linked, Non-participating Health Insurance plan offering financial protection for cancer diagnosis.',
      features: [
        'Regular premium plan',
        'Non-linked, Non-participating',
        'Early & Major stage cancer cover',
        'Financial protection',
        'Health insurance coverage'
      ],
      buyOnline: true,
      isNew: true
    },
    {
      id: 'index-plus',
      name: 'Index Plus',
      category: 'unit-linked',
      type: 'Unit Linked',
      description: 'Monthly premiums start as low as ₹2500/-, offering affordability with choice of two funds, including up to 100% in selected NIFTY 50 stocks.',
      features: [
        'Low premium starting ₹2500/month',
        'Two fund options',
        'Up to 100% NIFTY 50 stocks',
        'Guaranteed additions',
        'Policy value enhancement'
      ],
      buyOnline: true,
      isNew: true
    },
    {
      id: 'jeevan-shanti',
      name: 'New Jeevan Shanti',
      category: 'pension',
      type: 'Pension Plan',
      description: 'Single premium plan offering choice between Single Life and Joint Life Deferred annuity with guaranteed rates from policy start.',
      features: [
        'Single premium plan',
        'Single/Joint Life Deferred annuity',
        'Guaranteed rates from start',
        'Lifetime payments',
        'Deferment period option'
      ],
      buyOnline: true,
      isNew: true
    },
    {
      id: 'jeevan-akshay-vii',
      name: 'Jeevan Akshay - VII',
      category: 'pension',
      type: 'Immediate Annuity',
      description: 'Immediate Annuity plan allowing choice from 10 annuity options by paying lump sum amount with guaranteed rates.',
      features: [
        'Immediate annuity plan',
        '10 annuity options',
        'Lump sum payment',
        'Guaranteed rates from start',
        'Lifetime payments'
      ],
      buyOnline: true,
      isNew: false
    },

    // Endowment Plans
    {
      id: 'jeevan-anand',
      name: 'Jeevan Anand',
      category: 'endowment',
      type: 'Endowment Plan',
      description: 'A combination of Endowment Assurance and Whole Life plan providing financial protection and savings.',
      features: [
        'Endowment + Whole Life',
        'Maturity benefit',
        'Death benefit',
        'Bonus participation',
        'Loan facility available'
      ],
      buyOnline: true,
      isNew: false
    },
    {
      id: 'jeevan-labh',
      name: 'Jeevan Labh',
      category: 'endowment',
      type: 'Limited Premium',
      description: 'A limited premium paying endowment plan with high returns and bonus benefits.',
      features: [
        'Limited premium payment',
        'High returns',
        'Bonus benefits',
        'Maturity benefit',
        'Death benefit'
      ],
      buyOnline: true,
      isNew: false
    },

    // Money Back Plans
    {
      id: 'jeevan-umang',
      name: 'Jeevan Umang',
      category: 'money-back',
      type: 'Money Back Plan',
      description: 'A money back plan with survival benefits payable at regular intervals and maturity benefit.',
      features: [
        'Regular survival benefits',
        'Maturity benefit',
        'Death benefit',
        'Bonus participation',
        'Loan facility'
      ],
      buyOnline: true,
      isNew: false
    },

    // Term Plans
    {
      id: 'jeevan-amrit',
      name: 'Jeevan Amrit',
      category: 'term',
      type: 'Term Plan',
      description: 'Pure term insurance plan providing high coverage at low premium.',
      features: [
        'High coverage',
        'Low premium',
        'Pure protection',
        'Flexible term',
        'Online purchase'
      ],
      minAge: 18,
      maxAge: 65,
      minTerm: 10,
      maxTerm: 35,
      minSumAssured: 500000,
      maxSumAssured: 50000000,
      minPremium: 3000,
      maxPremium: 200000,
      premiumPaymentTerm: 'Regular',
      modeOfPayment: 'Yearly, Half-yearly, Quarterly, Monthly',
      policyTerm: '10 to 35 years',
      maturityBenefit: 'No maturity benefit (Pure term plan)',
      deathBenefit: 'Sum Assured on Death',
      loanAvailable: false,
      surrenderValue: 'No surrender value',
      revivalPeriod: '2 years',
      gracePeriod: '30 days',
      taxBenefit: 'Section 80C & 10(10D)',
      medicalExamination: 'Required for Sum Assured > 25 Lakhs',
      buyOnline: true,
      isNew: false,
      additionalInfo: {
        riders: ['Accidental Death Benefit', 'Premium Waiver Benefit', 'Critical Illness'],
        exclusions: 'Suicide within 12 months, War, Nuclear risks',
        specialFeatures: 'Pure term plan with no maturity benefit',
        claimSettlementRatio: '99.73%',
        bonusRate: 'Not applicable (Pure term plan)'
      }
    },

    // Whole Life Plans
    {
      id: 'jeevan-tarun',
      name: 'Jeevan Tarun',
      category: 'whole-life',
      type: 'Whole Life Plan',
      description: 'Whole life plan with limited premium payment providing lifelong coverage.',
      features: [
        'Limited premium payment',
        'Lifelong coverage',
        'Maturity benefit',
        'Death benefit',
        'Bonus participation'
      ],
      minAge: 18,
      maxAge: 65,
      minTerm: 15,
      maxTerm: 20,
      minSumAssured: 100000,
      maxSumAssured: 10000000,
      minPremium: 8000,
      maxPremium: 500000,
      premiumPaymentTerm: 'Limited (12-20 years)',
      modeOfPayment: 'Yearly, Half-yearly, Quarterly, Monthly',
      policyTerm: 'Whole life',
      maturityBenefit: 'Sum Assured + Vested Bonus',
      deathBenefit: 'Sum Assured + Vested Bonus',
      loanAvailable: true,
      surrenderValue: 'After 3 years',
      revivalPeriod: '2 years',
      gracePeriod: '30 days',
      taxBenefit: 'Section 80C & 10(10D)',
      medicalExamination: 'Required for Sum Assured > 25 Lakhs',
      buyOnline: true,
      isNew: false,
      additionalInfo: {
        riders: ['Accidental Death Benefit', 'Premium Waiver Benefit', 'Term Rider'],
        exclusions: 'Suicide within 12 months',
        specialFeatures: 'Whole life coverage with limited premium payment',
        claimSettlementRatio: '99.73%',
        bonusRate: 'Simple Reversionary Bonus (Varies annually)'
      }
    },

    // Unit Linked Plans
    {
      id: 'jeevan-unicorn',
      name: 'Jeevan Unicorn',
      category: 'unit-linked',
      type: 'Unit Linked Plan',
      description: 'Unit linked insurance plan with investment options and market-linked returns.',
      features: [
        'Investment options',
        'Market-linked returns',
        'Flexible premium',
        'Switching facility',
        'Partial withdrawal'
      ],
      buyOnline: true,
      isNew: false
    },

    // Micro Insurance
    {
      id: 'jeevan-mangal',
      name: 'Jeevan Mangal',
      category: 'micro',
      type: 'Micro Insurance',
      description: 'Micro insurance plan designed for low-income groups with affordable premiums.',
      features: [
        'Affordable premiums',
        'Low-income group focus',
        'Simple terms',
        'Basic coverage',
        'Easy enrollment'
      ],
      buyOnline: false,
      isNew: false
    }
  ];

  constructor() {}

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

  get filteredProducts() {
    let filtered = this.products;

    // Filter by category
    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === this.selectedCategory);
    }

    // Filter by search term
    if (this.searchTerm) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        product.features.some(feature => feature.toLowerCase().includes(this.searchTerm.toLowerCase()))
      );
    }

    return filtered;
  }

  getProductsByCategory(category: string) {
    return this.products.filter(product => product.category === category);
  }

  getCategoryName(categoryId: string) {
    const category = this.categories.find(cat => cat.id === categoryId);
    return category ? category.name : '';
  }


  getProductTypeColor(type: string): string {
    switch (type) {
      case 'New Product': return '#10b981';
      case 'Health Insurance': return '#f59e0b';
      case 'Pension Plan': return '#8b5cf6';
      case 'Unit Linked': return '#06b6d4';
      case 'Micro Insurance': return '#ef4444';
      default: return '#6b7280';
    }
  }

  viewProductDetails(product: any) {
    // Create a comprehensive detailed view for the product
    const details = `
═══════════════════════════════════════════════════════════════
                    ${product.name.toUpperCase()}
═══════════════════════════════════════════════════════════════

📋 BASIC INFORMATION:
• Product Name: ${product.name}
• Category: ${this.getCategoryName(product.category)}
• Type: ${product.type}
• Description: ${product.description}

👥 ELIGIBILITY:
• Entry Age: ${product.minAge || 'Not specified'} - ${product.maxAge || 'Not specified'} years
• Policy Term: ${product.minTerm || 'Not specified'} - ${product.maxTerm || 'Not specified'} years
• Sum Assured: ₹${product.minSumAssured ? (product.minSumAssured / 100000).toFixed(0) + ' Lakhs' : 'Not specified'} - ₹${product.maxSumAssured ? (product.maxSumAssured / 100000).toFixed(0) + ' Lakhs' : 'Not specified'}
• Premium Range: ₹${product.minPremium || 'Not specified'} - ₹${product.maxPremium || 'Not specified'}

💰 PAYMENT DETAILS:
• Premium Payment Term: ${product.premiumPaymentTerm || 'Not specified'}
• Mode of Payment: ${product.modeOfPayment || 'Not specified'}
• Grace Period: ${product.gracePeriod || 'Not specified'}

🎯 BENEFITS:
• Maturity Benefit: ${product.maturityBenefit || 'Not specified'}
• Death Benefit: ${product.deathBenefit || 'Not specified'}
• Loan Facility: ${product.loanAvailable ? 'Available' : 'Not Available'}
• Surrender Value: ${product.surrenderValue || 'Not specified'}

🏥 MEDICAL & LEGAL:
• Medical Examination: ${product.medicalExamination || 'Not specified'}
• Revival Period: ${product.revivalPeriod || 'Not specified'}
• Tax Benefits: ${product.taxBenefit || 'Not specified'}

🚀 SPECIAL FEATURES:
${product.features.map((feature: string) => `• ${feature}`).join('\n')}

${product.additionalInfo ? `
🔧 ADDITIONAL INFORMATION:
• Riders Available: ${product.additionalInfo.riders ? product.additionalInfo.riders.join(', ') : 'None'}
• Exclusions: ${product.additionalInfo.exclusions || 'Standard exclusions apply'}
• Special Features: ${product.additionalInfo.specialFeatures || 'None'}
• Claim Settlement Ratio: ${product.additionalInfo.claimSettlementRatio || 'Not specified'}
• Bonus Rate: ${product.additionalInfo.bonusRate || 'Not specified'}
` : ''}

═══════════════════════════════════════════════════════════════
    `.trim();
    
    alert(details);
  }

  openBuyOnline(product: any) {
    // Open buy online functionality
    alert(`Redirecting to buy ${product.name} online...`);
  }
}
