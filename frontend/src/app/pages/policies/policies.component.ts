import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ToastService } from '../../services/toast.service';
import { Router, RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';
import { MainLayoutComponent } from '../../components/layout/main-layout.component';
import { NavItem } from '../../components/sidenav/sidenav.component';
import { BreadcrumbItem } from '../../components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-policies',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, RouterModule, MainLayoutComponent],
  templateUrl: './policies.component.html',
  styleUrls: ['./policies.component.css']
})
export class PoliciesComponent implements OnInit {
  policies: any[] = [];
  filteredPolicies: any[] = [];
  globalSearchTerm: string = '';
  showForm = false;
  editingPolicy: any = null;
  selectedPolicies: number[] = [];
  selectAllChecked = false;
  isSubmitting = false;
  isSubmitted = false;
  validationErrors: Record<string, string> = {};
  saveMode: 'add' | 'update' = 'add';
  showDecisionModal = false;
  isUpdatingPayment = false;

  userRole: string = '';
  sidenavCollapsed = false;
  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Policy Management', route: '/policies' }
  ];

  policyForm = {
    policy_no: '',
    fullname: '',
    dob: '',
    gender: '',
    marital_status: '',
    aadhaar_pan: '',
    email: '',
    mobile: '',
    address: '',
    plan_name: '',
    start_date: '',
    end_date: '',
    mode_of_payment: '',
    deposit_date: '',
    next_premium_date: '',
    sum_assured: '',
    policy_term: '',
    premium_term: '',
    premium: '',
    maturity_value: '',
    nominee_name: '',
    nominee_relation: '',
    height_cm: '',
    weight_kg: '',
    health_lifestyle: '',
    bank_account: '',
    ifsc_code: '',
    bank_name: '',
    agent_code: '',
    branch_code: '',
    status: 'Active',
    payment_status: 'due'
  };

  constructor(
    private http: HttpClient,
    private router: Router,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.userRole = sessionStorage.getItem('role') || '';
    this.loadPolicies();
  }

  loadPolicies() {
    this.http.get<any[]>(`${environment.apiUrl}/policies/list`).subscribe({
      next: (data) => {
        console.log('Received policies data:', data[0]);
        console.log('Sample deposit_date:', data[0]?.deposit_date);
        // Ensure each policy has a payment_status field
        this.policies = data.map(policy => ({
          ...policy,
          payment_status: policy.payment_status || 'due'
        }));
        // Initialize filtered policies with all policies
        this.filteredPolicies = [...this.policies];
      },
      error: (error) => {
        console.error('Error loading policies:', error);
      }
    });
  }

  togglePaymentStatus(policy: any) {
    this.isUpdatingPayment = true;
    const newStatus = policy.payment_status === 'paid' ? 'due' : 'paid';
    
    this.http.put(`${environment.apiUrl}/api/policies/${policy.id}/payment-status`, {
      payment_status: newStatus
    }).subscribe({
      next: (response: any) => {
        // Update the policy in the local array
        policy.payment_status = newStatus;
        policy.next_premium_date = response.next_premium_date;
        policy.last_payment_date = response.last_payment_date;
        
        this.toastService.success(
          `Payment status updated to ${newStatus} for Policy ${policy.policy_no}`
        );
        this.isUpdatingPayment = false;
      },
      error: (error) => {
        console.error('Error updating payment status:', error);
        this.toastService.error(
          'Failed to update payment status. Please try again.'
        );
        this.isUpdatingPayment = false;
      }
    });
  }

  openForm(policy?: any) {
    if (policy) {
      this.editingPolicy = policy;
      
      // Format dates for HTML date inputs (YYYY-MM-DD format)
      const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toISOString().split('T')[0];
      };

      this.policyForm = { 
        ...policy,
        payment_status: policy.payment_status || 'due',
        dob: formatDate(policy.dob),
        start_date: formatDate(policy.start_date),
        end_date: formatDate(policy.end_date),
        deposit_date: formatDate(policy.deposit_date),
        next_premium_date: formatDate(policy.next_premium_date)
      };
      
      console.log('Policy data being loaded:', policy);
      console.log('Form data after processing:', this.policyForm);
      
      this.saveMode = 'update';
    } else {
      this.editingPolicy = null;
      this.resetForm();
      this.saveMode = 'add';
    }
    
    // Reset validation state
    this.isSubmitted = false;
    this.validationErrors = {};
    this.showForm = true;
  }

  resetForm() {
    this.policyForm = {
      policy_no: '',
      fullname: '',
      dob: '',
      gender: '',
      marital_status: '',
      aadhaar_pan: '',
      email: '',
      mobile: '',
      address: '',
      plan_name: '',
      start_date: '',
      end_date: '',
      mode_of_payment: '',
      deposit_date: '',
      next_premium_date: '',
      sum_assured: '',
      policy_term: '',
      premium_term: '',
      premium: '',
      maturity_value: '',
      nominee_name: '',
      nominee_relation: '',
      height_cm: '',
      weight_kg: '',
      health_lifestyle: '',
      bank_account: '',
      ifsc_code: '',
      bank_name: '',
      agent_code: '',
      branch_code: '',
      status: 'Active',
      payment_status: 'due'
    };
  }

  onSubmit(event: Event) {
    event.preventDefault();
    this.isSubmitted = true;
    this.validationErrors = this.validateForm(this.policyForm);
    if (Object.keys(this.validationErrors).length > 0) {
      this.toastService.error('Please fix the highlighted fields');
      return;
    }
    // If we are editing, ask user whether to create new or update using a modal
    if (this.editingPolicy) {
      this.showDecisionModal = true;
      return;
    }
    this.savePolicy();
  }

  decideSaveMode(choice: 'add' | 'update') {
    this.saveMode = choice;
    this.showDecisionModal = false;
    this.savePolicy();
  }

  validateForm(form: any): Record<string, string> {
    const errors: Record<string, string> = {};
    const requiredFields: Array<{ key: string; label: string }> = [
      { key: 'fullname', label: 'Full Name' },
      { key: 'dob', label: 'Date of Birth' },
      { key: 'plan_name', label: 'Plan Name' },
      { key: 'status', label: 'Status' }
    ];
    for (const field of requiredFields) {
      const value = (form[field.key] ?? '').toString().trim();
      if (!value) errors[field.key] = `${field.label} is required`;
    }
    return errors;
  }

  savePolicy() {
    if (this.isSubmitting) return;
    this.isSubmitting = true;
    const useAdd = this.saveMode === 'add' || !this.editingPolicy;
    const url = useAdd
      ? `${environment.apiUrl}/policies/add`
      : `${environment.apiUrl}/policies/update/${this.editingPolicy.id}`;
    const method = useAdd ? 'post' : 'put';
    
    console.log('Sending policy data:', this.policyForm);
    console.log('Deposit date being sent:', this.policyForm.deposit_date);
    this.http[method](url, this.policyForm).subscribe({
      next: (response: any) => {
        if (response && (response.success || response.policy_id)) {
          this.toastService.success(this.editingPolicy ? 'Policy updated successfully' : 'Policy created successfully');
          this.loadPolicies();
          this.showForm = false;
          this.resetForm();
        }
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('Error saving policy:', error);
        this.toastService.error(error?.error?.error || 'Failed to save policy');
        this.isSubmitting = false;
      }
    });
  }

  deletePolicy(id: number) {
    if (confirm('Are you sure you want to delete this policy?')) {
      this.http.delete(`${environment.apiUrl}/policies/delete/${id}`).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.toastService.success('Policy deleted successfully');
            this.loadPolicies();
          }
        },
        error: (error) => {
          console.error('Error deleting policy:', error);
          this.toastService.error('Failed to delete policy');
        }
      });
    }
  }

  closeForm() {
    this.showForm = false;
    this.resetForm();
  }

  selectAll(event: any) {
    if (event.target.checked) {
      this.selectedPolicies = this.policies.map(p => p.id);
      this.selectAllChecked = true;
    } else {
      this.selectedPolicies = [];
      this.selectAllChecked = false;
    }
  }

  toggleSelection(id: number) {
    const index = this.selectedPolicies.indexOf(id);
    if (index > -1) {
      this.selectedPolicies.splice(index, 1);
    } else {
      this.selectedPolicies.push(id);
    }
    this.selectAllChecked = this.selectedPolicies.length === this.policies.length;
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

  onSidenavToggle(collapsed: boolean) {
    this.sidenavCollapsed = collapsed;
  }

  // Global Search Methods
  onGlobalSearch() {
    if (!this.globalSearchTerm || this.globalSearchTerm.trim() === '') {
      this.filteredPolicies = [...this.policies];
      return;
    }

    const searchTerm = this.globalSearchTerm.toLowerCase().trim();
    
    this.filteredPolicies = this.policies.filter(policy => {
      // Search across all relevant fields
      return (
        this.searchInField(policy.policy_no, searchTerm) ||
        this.searchInField(policy.fullname, searchTerm) ||
        this.searchInField(policy.email, searchTerm) ||
        this.searchInField(policy.mobile, searchTerm) ||
        this.searchInField(policy.plan_name, searchTerm) ||
        this.searchInField(policy.address, searchTerm) ||
        this.searchInField(policy.aadhaar_pan, searchTerm) ||
        this.searchInField(policy.nominee_name, searchTerm) ||
        this.searchInField(policy.payment_status, searchTerm) ||
        this.searchInField(policy.gender, searchTerm) ||
        this.searchInField(policy.marital_status, searchTerm) ||
        this.searchInField(policy.bank_name, searchTerm) ||
        this.searchInField(policy.agent_code, searchTerm) ||
        this.searchInField(policy.branch_code, searchTerm) ||
        this.searchInField(policy.status, searchTerm) ||
        this.searchInDate(policy.dob, searchTerm) ||
        this.searchInDate(policy.start_date, searchTerm) ||
        this.searchInDate(policy.end_date, searchTerm) ||
        this.searchInDate(policy.next_premium_date, searchTerm)
      );
    });
  }

  private searchInField(field: any, searchTerm: string): boolean {
    if (!field) return false;
    return field.toString().toLowerCase().includes(searchTerm);
  }

  private searchInDate(dateField: any, searchTerm: string): boolean {
    if (!dateField) return false;
    
    // Convert date to string and search
    const dateStr = new Date(dateField).toLocaleDateString();
    return dateStr.toLowerCase().includes(searchTerm) || 
           dateField.toString().toLowerCase().includes(searchTerm);
  }

  clearGlobalSearch() {
    this.globalSearchTerm = '';
    this.filteredPolicies = [...this.policies];
  }

  // Deposit Date and Payment Mode change handlers
  onDepositDateChange() {
    this.calculateNextPremiumDate();
  }

  onPaymentModeChange() {
    this.calculateNextPremiumDate();
  }

  calculateNextPremiumDate() {
    if (!this.policyForm.deposit_date || !this.policyForm.mode_of_payment) {
      return;
    }

    const depositDate = new Date(this.policyForm.deposit_date);
    let nextPremiumDate = new Date(depositDate);

    switch (this.policyForm.mode_of_payment) {
      case 'Monthly':
        nextPremiumDate.setMonth(nextPremiumDate.getMonth() + 1);
        break;
      case 'Quarterly':
        nextPremiumDate.setMonth(nextPremiumDate.getMonth() + 3);
        break;
      case 'Half Yearly':
        nextPremiumDate.setMonth(nextPremiumDate.getMonth() + 6);
        break;
      case 'Yearly':
        nextPremiumDate.setFullYear(nextPremiumDate.getFullYear() + 1);
        break;
      default:
        return;
    }

    // Format the date as YYYY-MM-DD for the input field
    this.policyForm.next_premium_date = nextPremiumDate.toISOString().split('T')[0];
  }
}
