import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { MainLayoutComponent } from '../../components/layout/main-layout.component';
import { NavItem } from '../../components/sidenav/sidenav.component';
import { BreadcrumbItem } from '../../components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-deposits',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MainLayoutComponent],
  templateUrl: './deposits.component.html',
  styleUrl: './deposits.component.css'
})
export class DepositsComponent implements OnInit {
  deposits: any[] = [];
  filteredDeposits: any[] = [];
  selectedDeposits: number[] = [];
  selectAllChecked = false;
  showModal = false;
  editingDeposit: any = null;
  depositForm: any = {};
  customers: any[] = [];
  
  totalDeposits = 0;
  activeCustomers = 0;
  monthlyDeposits = 0;


  userRole: string = '';
  sidenavCollapsed = false;
  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Deposit Management', route: '/deposits' }
  ];

  constructor(private router: Router) {}

  async ngOnInit() {
    this.userRole = sessionStorage.getItem('role') || '';
    await this.loadDeposits();
    await this.loadCustomers();
    this.calculateStats();
  }

  async loadDeposits() {
    try {
      const res = await fetch(`${environment.apiUrl}/deposits/list`, { credentials: 'include' });
      this.deposits = await res.json();
      this.filteredDeposits = [...this.deposits];
    } catch (err) {
      console.error('Failed to load deposits:', err);
    }
  }

  calculateStats() {
    this.totalDeposits = this.deposits.reduce((sum, d) => sum + (d.amount || 0), 0);
    this.activeCustomers = new Set(this.deposits.map(d => d.customer_code)).size;
    
    const currentMonth = new Date().getMonth();
    this.monthlyDeposits = this.deposits
      .filter(d => new Date(d.date).getMonth() === currentMonth)
      .reduce((sum, d) => sum + (d.amount || 0), 0);
  }

  filterDeposits(event: any) {
    const searchTerm = event.target.value.toLowerCase();
    this.filteredDeposits = this.deposits.filter(deposit =>
      deposit.customer_code?.toLowerCase().includes(searchTerm) ||
      deposit.customer_name?.toLowerCase().includes(searchTerm)
    );
  }

  openCreateModal() {
    this.editingDeposit = null;
    this.depositForm = {};
    this.showModal = true;
  }

  editDeposit(deposit: any) {
    this.editingDeposit = deposit;
    this.depositForm = { ...deposit };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.editingDeposit = null;
    this.depositForm = {};
  }

  async saveDeposit(event: Event) {
    event.preventDefault();
    
    try {
      const url = this.editingDeposit 
        ? `${environment.apiUrl}/deposits/update/${this.editingDeposit.id}`
        : `${environment.apiUrl}/deposits/create`;
      
      const method = this.editingDeposit ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.depositForm),
        credentials: 'include'
      });
      
      if (res.ok) {
        alert(this.editingDeposit ? 'Deposit updated!' : 'Deposit created!');
        this.closeModal();
        await this.loadDeposits();
        this.calculateStats();
      } else {
        const errorText = await res.text();
        alert(`Operation failed: ${errorText}`);
      }
    } catch (err) {
      alert('Operation failed');
    }
  }

  async deleteDeposit(id: number) {
    if (confirm('Delete this deposit?')) {
      try {
        const res = await fetch(`${environment.apiUrl}/deposits/delete/${id}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        if (res.ok) {
          await this.loadDeposits();
          this.calculateStats();
        }
      } catch (err) {
        alert('Delete failed');
      }
    }
  }

  toggleSelection(id: number) {
    const index = this.selectedDeposits.indexOf(id);
    if (index > -1) {
      this.selectedDeposits.splice(index, 1);
    } else {
      this.selectedDeposits.push(id);
    }
    this.updateSelectAllState();
  }

  selectAll(event: any) {
    if (event.target.checked) {
      this.selectedDeposits = this.filteredDeposits.map(d => d.id);
    } else {
      this.selectedDeposits = [];
    }
    this.selectAllChecked = event.target.checked;
  }

  updateSelectAllState() {
    this.selectAllChecked = this.selectedDeposits.length === this.filteredDeposits.length;
  }

  async deleteSelected() {
    if (this.selectedDeposits.length === 0) return;
    
    if (confirm(`Delete ${this.selectedDeposits.length} selected deposits?`)) {
      try {
        const res = await fetch(`${environment.apiUrl}/deposits/delete-multiple`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: this.selectedDeposits }),
          credentials: 'include'
        });
        
        if (res.ok) {
          this.selectedDeposits = [];
          await this.loadDeposits();
          this.calculateStats();
        }
      } catch (err) {
        alert('Delete failed');
      }
    }
  }

  async uploadExcel(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ];
    
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
      alert('Please upload a valid Excel file (.xlsx, .xls) or CSV file (.csv)');
      return;
    }
    
    const formData = new FormData();
    formData.append('excel', file);
    
    try {
      console.log('Uploading file:', file.name, 'Type:', file.type, 'Size:', file.size);
      
      const res = await fetch(`${environment.apiUrl}/deposits/upload-excel`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      const result = await res.json();
      
      if (res.ok) {
        alert(`Excel imported successfully! ${result.message || ''}`);
        await this.loadDeposits();
        this.calculateStats();
      } else {
        console.error('Upload failed:', result);
        alert(`Import failed: ${result.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Upload error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Network error';
      alert(`Import failed: ${errorMessage}`);
    } finally {
      // Clear the file input
      event.target.value = '';
    }
  }

  downloadTemplate() {
    // Create a simple CSV template
    const csvContent = 'Customer Code,Customer Name,Amount,Penalty,Date,Remark\n' +
                      'CUST001,John Doe,10000,0,2024-01-15,Sample deposit\n' +
                      'CUST002,Jane Smith,15000,500,2024-01-16,Another deposit';
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'deposits_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    this.router.navigate(['/login']);
  }

  async loadCustomers() {
    try {
      const res = await fetch(`${environment.apiUrl}/customers/list`, { credentials: 'include' });
      this.customers = await res.json();
    } catch (err) {
      console.error('Failed to load customers:', err);
    }
  }

  getCustomerName(customerCode: string): string {
    const customer = this.customers.find(c => c.customer_code === customerCode);
    return customer ? customer.name : 'Unknown Customer';
  }

  onCustomerChange(event: any) {
    const customerCode = event.target.value;
    this.depositForm.customer_code = customerCode;
    if (customerCode) {
      const customer = this.customers.find(c => c.customer_code === customerCode);
      if (customer) {
        this.depositForm.customer_name = customer.name;
      }
    }
  }
}
