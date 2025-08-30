import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ToastService } from '../../services/toast.service';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-policies',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, RouterModule],
  templateUrl: './policies.component.html',
  styleUrl: './policies.component.css'
})
export class PoliciesComponent implements OnInit {
  policies: any[] = [];
  showForm = false;
  editingPolicy: any = null;
  selectedPolicies: number[] = [];
  selectAllChecked = false;

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
    this.http.get<any[]>('http://localhost:8080/policies/list').subscribe({
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
    } else {
      this.editingPolicy = null;
      this.resetForm();
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

  savePolicy() {
    const url = this.editingPolicy 
      ? `http://localhost:8080/policies/update/${this.editingPolicy.id}`
      : 'http://localhost:8080/policies/add';
    
    const method = this.editingPolicy ? 'put' : 'post';
    
    this.http[method](url, this.policyForm).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.toastService.success(this.editingPolicy ? 'Policy updated successfully' : 'Policy created successfully');
          this.loadPolicies();
          this.showForm = false;
          this.resetForm();
        }
      },
      error: (error) => {
        console.error('Error saving policy:', error);
        this.toastService.error('Failed to save policy');
      }
    });
  }

  deletePolicy(id: number) {
    if (confirm('Are you sure you want to delete this policy?')) {
      this.http.delete(`http://localhost:8080/policies/delete/${id}`).subscribe({
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
