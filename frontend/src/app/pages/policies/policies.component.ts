import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ToastService } from '../../services/toast.service';
import { Router, RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-policies',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, RouterModule],
  templateUrl: './policies.component.html',
  styleUrls: ['./policies.component.css']
})
export class PoliciesComponent implements OnInit {
  policies: any[] = [];
  showForm = false;
  editingPolicy: any = null;
  selectedPolicies: number[] = [];
  selectAllChecked = false;
  isSubmitting = false;
  isSubmitted = false;
  validationErrors: Record<string, string> = {};
  saveMode: 'add' | 'update' = 'add';
  showDecisionModal = false;

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
    status: 'Active'
  };

  constructor(
    private http: HttpClient,
    private router: Router,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadPolicies();
  }

  loadPolicies() {
    this.http.get<any[]>(`${environment.apiUrl}/policies/list`).subscribe({
      next: (data) => {
        this.policies = data;
      },
      error: (error) => {
        console.error('Error loading policies:', error);
      }
    });
  }

  openForm(policy?: any) {
    if (policy) {
      this.editingPolicy = policy;
      this.policyForm = { ...policy };
      this.saveMode = 'update';
    } else {
      this.editingPolicy = null;
      this.resetForm();
      this.saveMode = 'add';
    }
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
      status: 'Active'
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
}
