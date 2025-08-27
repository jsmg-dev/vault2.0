import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-deposits',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
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
  
  totalDeposits = 0;
  activeCustomers = 0;
  monthlyDeposits = 0;

  async ngOnInit() {
    await this.loadDeposits();
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
    
    const formData = new FormData();
    formData.append('excel', file);
    
    try {
      const res = await fetch(`${environment.apiUrl}/deposits/upload-excel`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (res.ok) {
        alert('Excel imported successfully!');
        await this.loadDeposits();
        this.calculateStats();
      } else {
        alert('Import failed');
      }
    } catch (err) {
      alert('Import failed');
    }
  }

  downloadTemplate() {
    window.location.href = '/deposits/template';
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }
}
