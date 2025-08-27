import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';

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
  
  // Stats properties
  totalCustomers = 0;
  activeCustomers = 0;
  monthlyCustomers = 0;

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
  }

  closeCreateCustomerModal() {
    this.showCreateModal = false;
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
          alert("Failed to delete customer.");
        }
      } catch (err) {
        alert("Failed to delete customer.");
      }
    }
  }

  async createCustomer(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const data: any = {};
    
    // Extract form data manually to avoid TypeScript compatibility issues
    for (let i = 0; i < form.elements.length; i++) {
      const element = form.elements[i] as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
      if (element.name && element.value !== undefined) {
        data[element.name] = element.value;
      }
    }
    
    try {
      const res = await fetch(`${environment.apiUrl}/customers/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      if (res.ok) {
        alert('Customer created successfully!');
        this.closeCreateCustomerModal();
        await this.loadCustomers();
      } else {
        const result = await res.json();
        alert(result.error || 'Error occurred.');
      }
    } catch (err) {
      alert('Error occurred.');
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
        alert('Customer updated successfully');
        this.closeEditCustomerModal();
        await this.loadCustomers();
      } else {
        alert('Update failed');
      }
    } catch (err) {
      alert('Update failed');
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
        alert('Excel uploaded and data imported successfully!');
        await this.loadCustomers();
      } else {
        const result = await res.json();
        alert(result.error || 'Upload failed.');
      }
    } catch (err) {
      alert('Upload failed');
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
        alert('Delete failed');
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
}
