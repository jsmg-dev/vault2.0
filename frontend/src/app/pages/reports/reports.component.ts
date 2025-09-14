import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { MainLayoutComponent } from '../../components/layout/main-layout.component';
import { NavItem } from '../../components/sidenav/sidenav.component';
import { BreadcrumbItem } from '../../components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MainLayoutComponent],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css'
})
export class ReportsComponent implements OnInit {
  activeTab = 'customer';
  reportForm: any = {
    start_date: '',
    end_date: '',
    customer_id: ''
  };
  reportData: any[] = [];
  reportHeaders: string[] = [];
  customers: any[] = [];
  emiNotifications: any[] = [];
  hasSearched = false;


  userRole: string = '';
  sidenavCollapsed = false;
  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Generate Report', route: '/reports' }
  ];

  constructor(private router: Router) {}

  ngOnInit() {
    this.userRole = sessionStorage.getItem('role') || '';
    this.loadCustomers();
    this.checkEmiNotifications();
    this.setDefaultDates();
    
    // Check EMI notifications every minute
    setInterval(() => this.checkEmiNotifications(), 60000);
  }

  setDefaultDates() {
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    
    this.reportForm.start_date = lastMonth.toISOString().split('T')[0];
    this.reportForm.end_date = today.toISOString().split('T')[0];
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
    this.reportData = [];
    this.hasSearched = false;
  }

  async loadCustomers() {
    try {
      const res = await fetch(`${environment.apiUrl}/customers/list`, { credentials: 'include' });
      this.customers = await res.json();
    } catch (err) {
      console.error('Failed to load customers:', err);
    }
  }

  async checkEmiNotifications() {
    try {
      const res = await fetch(`${environment.apiUrl}/emi/notifications`, { credentials: 'include' });
      const data = await res.json();
      this.emiNotifications = data.notifications || [];
    } catch (err) {
      console.error('Failed to load EMI notifications:', err);
    }
  }

  async generateReport(event: Event) {
    event.preventDefault();
    
    if (!this.reportForm.start_date || !this.reportForm.end_date) {
      alert('Please select both start and end dates');
      return;
    }

    if (this.activeTab === 'deposit' && !this.reportForm.customer_id) {
      alert('Please select a customer for deposit reports');
      return;
    }

    try {
      let query = `${environment.apiUrl}/reports/generate?type=${this.activeTab}&start=${this.reportForm.start_date}&end=${this.reportForm.end_date}`;
      
      if (this.activeTab === 'deposit' && this.reportForm.customer_id) {
        query += `&customer_id=${this.reportForm.customer_id}`;
      }

      const response = await fetch(query, { credentials: 'include' });
      const data = await response.json();
      
      this.reportData = data || [];
      this.hasSearched = true;
      
      if (this.reportData.length > 0) {
        this.reportHeaders = Object.keys(this.reportData[0]);
      }
    } catch (err) {
      console.error('Report generation failed:', err);
      alert('Failed to generate report. Please try again.');
    }
  }

  exportToCSV() {
    if (!this.reportData || this.reportData.length === 0) {
      alert('No data available to export');
      return;
    }

    const headers = this.reportHeaders;
    const rows = this.reportData.map(row => 
      headers.map(header => `"${(row[header] || '').toString().replace(/"/g, '""')}"`).join(',')
    );
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${this.activeTab}_report_${new Date().toISOString().split('T')[0]}.csv`;
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
}
