import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

declare var Chart: any;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('barChart') barChartRef!: ElementRef;
  @ViewChild('pieChart') pieChartRef!: ElementRef;
  @ViewChild('lineChart') lineChartRef!: ElementRef;

  totalCustomers = 0;
  totalDeposits = 0;
  activeLoans = 0;
  customersPerMonth: Array<{ month: string; count: number }> = [];
  isFullscreen = false;

  async ngOnInit() {
    try {
      const res = await fetch('/api/customers/count', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        this.totalCustomers = Number(data.totalCustomers || 0);
        this.totalDeposits = Number(data.totalDeposits || 0);
        this.activeLoans = Number(data.activeLoans || 0);
        if (data.customersPerMonth) {
          this.customersPerMonth = Object.keys(data.customersPerMonth).map(m => ({ month: m, count: data.customersPerMonth[m] }));
        }
      }
    } catch {}
  }

  ngAfterViewInit() {
    this.initCharts();
  }

  initCharts() {
    // Bar Chart
    new Chart(this.barChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'Customers',
          data: [120, 190, 300, 250, 400, 320],
          backgroundColor: '#004aad'
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true }
        }
      }
    });

    // Pie Chart
    new Chart(this.pieChartRef.nativeElement, {
      type: 'pie',
      data: {
        labels: ['Personal Loan', 'Business Loan', 'Home Loan', 'Education Loan'],
        datasets: [{
          data: [300, 200, 150, 100],
          backgroundColor: ['#004aad', '#43a047', '#f9a825', '#e53935']
        }]
      },
      options: { responsive: true }
    });

    // Line Chart
    new Chart(this.lineChartRef.nativeElement, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'Revenue (in ₹)',
          data: [20000, 25000, 27000, 30000, 28000, 35000],
          borderColor: '#004aad',
          backgroundColor: 'rgba(0,74,173,0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      this.isFullscreen = true;
    } else {
      document.exitFullscreen();
      this.isFullscreen = false;
    }
  }
}
