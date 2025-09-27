import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { ToastService } from '../../services/toast.service';
import { LanguageService } from '../../services/language.service';
import { MainLayoutComponent } from '../../components/layout/main-layout.component';
import { BreadcrumbItem } from '../../components/breadcrumb/breadcrumb.component';
import { environment } from '../../../environments/environment';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-billing-config',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, MainLayoutComponent],
  templateUrl: './billing-config.component.html',
  styleUrls: ['./billing-config.component.css']
})
export class BillingConfigComponent implements OnInit, OnDestroy {
  billingConfig: any = {};
  previewData: any = {};
  isSubmitting = false;
  isSubmitted = false;
  validationErrors: Record<string, string> = {};

  userRole: string = '';
  sidenavCollapsed = false;
  breadcrumbItems: BreadcrumbItem[] = [
    { label: this.languageService.translate('clothaura.configure'), route: '/billing-config' }
  ];

  private languageSubscription: Subscription = new Subscription();

  // Form sections
  showCompanyInfo = true;
  showInvoiceSettings = true;
  showTemplates = true;
  showAutomation = true;

  // Sample data for preview
  sampleItems = [
    { name: 'Sample Service 1', quantity: 2, price: 100, total: 200 },
    { name: 'Sample Service 2', quantity: 1, price: 150, total: 150 }
  ];

  constructor(
    private http: HttpClient,
    private toastService: ToastService,
    private router: Router,
    private languageService: LanguageService
  ) {}

  ngOnInit() {
    // Subscribe to language changes
    this.languageSubscription = this.languageService.currentLanguage$.subscribe(() => {
      this.updateBreadcrumbItems();
    });
    
    this.loadBillingConfig();
    this.generatePreview();
  }

  ngOnDestroy() {
    this.languageSubscription.unsubscribe();
  }

  private updateBreadcrumbItems() {
    this.breadcrumbItems = [
      { label: this.languageService.translate('clothaura.configure'), route: '/billing-config' }
    ];
  }

  translate(key: string): string {
    return this.languageService.translate(key);
  }

  loadBillingConfig() {
    this.http.get(`${environment.apiUrl}/billing-config`).subscribe({
      next: (config: any) => {
        this.billingConfig = config;
        this.generatePreview();
      },
      error: (error) => {
        console.error('Error loading billing config:', error);
        this.toastService.show('Error loading billing configuration', 'error');
      }
    });
  }

  generatePreview() {
    const previewRequest = {
      customer_name: 'Sample Customer',
      customer_phone: '+91-9876543210',
      customer_address: '123 Sample Street, Sample City, 123456',
      items: this.sampleItems,
      subtotal: 350,
      tax_rate: this.billingConfig.tax_rate || 18,
      tax_amount: 63,
      total_amount: 413
    };

    this.http.post(`${environment.apiUrl}/billing-config/preview`, previewRequest).subscribe({
      next: (preview: any) => {
        this.previewData = preview;
      },
      error: (error) => {
        console.error('Error generating preview:', error);
      }
    });
  }

  onConfigChange() {
    // Regenerate preview when configuration changes
    this.generatePreview();
  }

  validateForm(): boolean {
    this.validationErrors = {};
    let isValid = true;

    if (!this.billingConfig.company_name?.trim()) {
      this.validationErrors['company_name'] = 'Company name is required';
      isValid = false;
    }

    if (!this.billingConfig.currency?.trim()) {
      this.validationErrors['currency'] = 'Currency is required';
      isValid = false;
    }

    if (!this.billingConfig.currency_symbol?.trim()) {
      this.validationErrors['currency_symbol'] = 'Currency symbol is required';
      isValid = false;
    }

    if (this.billingConfig.tax_rate < 0 || this.billingConfig.tax_rate > 100) {
      this.validationErrors['tax_rate'] = 'Tax rate must be between 0 and 100';
      isValid = false;
    }

    if (this.billingConfig.due_days < 0) {
      this.validationErrors['due_days'] = 'Due days must be a positive number';
      isValid = false;
    }

    return isValid;
  }

  saveConfiguration() {
    this.isSubmitted = true;
    
    if (!this.validateForm()) {
      this.toastService.show('Please fix the validation errors', 'error');
      return;
    }

    this.isSubmitting = true;
    this.billingConfig.updated_by = 'admin'; // This should come from auth service

    this.http.put(`${environment.apiUrl}/billing-config`, this.billingConfig).subscribe({
      next: (response: any) => {
        this.billingConfig = response;
        this.isSubmitting = false;
        this.isSubmitted = false;
        this.toastService.show('Billing configuration saved successfully', 'success');
        this.generatePreview();
      },
      error: (error) => {
        console.error('Error saving billing config:', error);
        this.isSubmitting = false;
        this.toastService.show('Error saving billing configuration', 'error');
      }
    });
  }

  resetForm() {
    this.loadBillingConfig();
    this.isSubmitted = false;
    this.validationErrors = {};
  }

  toggleSection(section: string) {
    switch (section) {
      case 'company':
        this.showCompanyInfo = !this.showCompanyInfo;
        break;
      case 'invoice':
        this.showInvoiceSettings = !this.showInvoiceSettings;
        break;
      case 'templates':
        this.showTemplates = !this.showTemplates;
        break;
      case 'automation':
        this.showAutomation = !this.showAutomation;
        break;
    }
  }

  formatCurrency(amount: number): string {
    const symbol = this.billingConfig.currency_symbol || '₹';
    return `${symbol}${amount.toFixed(2)}`;
  }

  calculateTax(subtotal: number): number {
    const taxRate = this.billingConfig.tax_rate || 18;
    return (subtotal * taxRate) / 100;
  }

  calculateTotal(subtotal: number): number {
    return subtotal + this.calculateTax(subtotal);
  }

  closeConfiguration() {
    // Navigate back to ClothAura settings
    this.router.navigate(['/laundry'], { queryParams: { tab: 'whatsapp' } });
  }
}
