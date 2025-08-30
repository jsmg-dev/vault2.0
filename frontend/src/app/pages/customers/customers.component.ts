import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './customers.component.html',
  styleUrl: './customers.component.css'
})
export class CustomersComponent implements OnInit {
  customers: any[] = [];
  filteredCustomers: any[] = [];
  selectedCustomers: number[] = [];
  selectAllChecked = false;
  showCreateModal = false;
  showEditModal = false;
  editForm: any = {};
  customerForm: any = {};
  photoPreview: string | null = null;
  documentName: string | null = null;
  
  // Stats properties
  totalCustomers = 0;
  activeCustomers = 0;
  monthlyCustomers = 0;

  constructor(private toastService: ToastService) {}

  async ngOnInit() {
    await this.loadCustomers();
    this.calculateStats();
  }

  async loadCustomers() {
    try {
      const res = await fetch(`${environment.apiUrl}/customers/list`, { 
        method: 'GET', 
        headers: { 'Cache-Control': 'no-cache' },
        credentials: 'include'
      });
      this.customers = await res.json();
      this.filteredCustomers = [...this.customers];
      this.calculateStats();
    } catch (err) {
      console.error('Failed to load customers:', err);
    }
  }

  calculateStats() {
    this.totalCustomers = this.customers.length;
    this.activeCustomers = this.customers.filter(c => c.status === 'active').length;
    
    const currentMonth = new Date().getMonth();
    this.monthlyCustomers = this.customers.filter(c => {
      if (c.start_date) {
        const startDate = new Date(c.start_date);
        return startDate.getMonth() === currentMonth;
      }
      return false;
    }).length;
  }

  filterCustomers(event: any) {
    const searchTerm = event.target.value.toLowerCase();
    this.filteredCustomers = this.customers.filter(customer =>
      customer.id?.toString().includes(searchTerm) ||
      customer.customer_code?.toLowerCase().includes(searchTerm) ||
      customer.name?.toLowerCase().includes(searchTerm) ||
      customer.contact_no?.includes(searchTerm)
    );
  }

  openCreateCustomerModal() {
    this.showCreateModal = true;
    this.customerForm = {};
  }

  closeCreateCustomerModal() {
    this.showCreateModal = false;
    this.resetFileUploads();
  }

  openEditCustomerModal(id: number) {
    this.editForm = this.customers.find(c => c.id === id) || {};
    this.showEditModal = true;
  }

  closeEditCustomerModal() {
    this.showEditModal = false;
    this.editForm = {};
  }

  async deleteCustomer(id: number) {
    if (confirm("Are you sure you want to delete this customer?")) {
      try {
        const res = await fetch(`${environment.apiUrl}/customers/delete/${id}`, { 
          method: 'DELETE',
          credentials: 'include'
        });
        if (res.ok) {
          await this.loadCustomers();
        } else {
          this.toastService.error("Failed to delete customer.");
        }
      } catch (err) {
        this.toastService.error("Failed to delete customer.");
      }
    }
  }

  async createCustomer(event: Event) {
    event.preventDefault();
    
    // Create FormData with customerForm values
    const formData = new FormData();
    formData.append('customer_code', this.customerForm.customer_code || '');
    formData.append('name', this.customerForm.name || '');
    formData.append('contact_no', this.customerForm.contact_no || '');
    formData.append('alt_contact_no', this.customerForm.alt_contact_no || '');
    formData.append('start_date', this.customerForm.start_date || '');
    formData.append('end_date', this.customerForm.end_date || '');
    formData.append('loan_duration', this.customerForm.loan_duration || '');
    formData.append('loan_amount', this.customerForm.loan_amount || '');
    formData.append('file_charge', this.customerForm.file_charge || '');
    formData.append('agent_fee', this.customerForm.agent_fee || '');
    formData.append('emi', this.customerForm.emi || '');
    formData.append('advance_days', this.customerForm.advance_days || '');
    formData.append('amount_after_deduction', this.customerForm.amount_after_deduction || '');
    formData.append('agent_commission', this.customerForm.agent_commission || '');
    formData.append('status', this.customerForm.status || 'active');
    formData.append('remark', this.customerForm.remark || '');
    
    // Add files if they exist
    if (this.photoPreview) {
      // Convert base64 to blob for photo
      const photoBlob = await fetch(this.photoPreview).then(r => r.blob());
      formData.append('customerphoto', photoBlob, 'photo.jpg');
    }
    
    try {
      const res = await fetch(`${environment.apiUrl}/customers/create`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      if (res.ok) {
        this.toastService.success('Customer created successfully!');
        this.closeCreateCustomerModal();
        this.resetFileUploads();
        await this.loadCustomers();
      } else {
        const result = await res.json();
        this.toastService.error(result.error || 'Error occurred.');
      }
    } catch (err) {
      this.toastService.error('Error occurred.');
    }
  }

  async updateCustomer(event: Event) {
    event.preventDefault();
    try {
      const res = await fetch(`${environment.apiUrl}/customers/update/${this.editForm.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.editForm),
        credentials: 'include'
      });
      if (res.ok) {
        this.toastService.success('Customer updated successfully');
        this.closeEditCustomerModal();
        await this.loadCustomers();
      } else {
        this.toastService.error('Update failed');
      }
    } catch (err) {
      this.toastService.error('Update failed');
    }
  }

  async uploadExcel(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('excel', file);
    
    try {
      const res = await fetch(`${environment.apiUrl}/customers/upload-excel`, { 
        method: 'POST', 
        body: formData,
        credentials: 'include'
      });
              if (res.ok) {
          this.toastService.success('Excel uploaded and data imported successfully!');
          await this.loadCustomers();
        } else {
          const result = await res.json();
          this.toastService.error(result.error || 'Upload failed.');
        }
      } catch (err) {
        this.toastService.error('Upload failed');
      }
  }

  downloadTemplate() {
    window.location.href = '/customers/template';
  }

  toggleSelection(id: number) {
    const index = this.selectedCustomers.indexOf(id);
    if (index > -1) {
      this.selectedCustomers.splice(index, 1);
    } else {
      this.selectedCustomers.push(id);
    }
    this.updateSelectAllState();
  }

  selectAll(event: any) {
    if (event.target.checked) {
      this.selectedCustomers = this.filteredCustomers.map(c => c.id);
    } else {
      this.selectedCustomers = [];
    }
    this.selectAllChecked = event.target.checked;
  }

  updateSelectAllState() {
    this.selectAllChecked = this.selectedCustomers.length === this.filteredCustomers.length;
  }

  async deleteSelected() {
    if (this.selectedCustomers.length === 0) return;
    
    if (confirm(`Delete ${this.selectedCustomers.length} selected customers?`)) {
      try {
        const res = await fetch(`${environment.apiUrl}/customers/delete-multiple`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: this.selectedCustomers }),
          credentials: 'include'
        });
        
        if (res.ok) {
          this.selectedCustomers = [];
          await this.loadCustomers();
        }
      } catch (err) {
        this.toastService.error('Delete failed');
      }
    }
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  onPhotoUpload(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.photoPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  onDocumentUpload(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.documentName = file.name;
    }
  }

  resetFileUploads() {
    this.photoPreview = null;
    this.documentName = null;
  }
}
