import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { MainLayoutComponent } from '../../components/layout/main-layout.component';
import { NavItem } from '../../components/sidenav/sidenav.component';
import { BreadcrumbItem } from '../../components/breadcrumb/breadcrumb.component';

declare var Chart: any;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MainLayoutComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('barChart') barChartRef!: ElementRef;
  @ViewChild('pieChart') pieChartRef!: ElementRef;
  @ViewChild('lineChart') lineChartRef!: ElementRef;
   router = inject(Router);
  totalCustomers = 0;
  totalDeposits = 0;
  activeLoans = 0;
  monthlyEarnings = 0;
  customersPerMonth: Array<{ month: string; count: number }> = [];
  loanTypeDistribution: { [key: string]: number } = {};
  isFullscreen = false;
  userRole: string = '';
  sidenavCollapsed = false;
  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', active: true }
  ];
  


  async ngOnInit() {
    this.userRole = sessionStorage.getItem('role') || '';
    console.log('Dashboard - userRole from sessionStorage:', this.userRole);
    console.log('Dashboard - userRole type:', typeof this.userRole);
    console.log('Dashboard - userRole === clothAura:', this.userRole === 'clothAura');
    await this.loadDashboardStats();
  }

  async loadDashboardStats() {
    try {
      const res = await fetch(`${environment.apiUrl}/dashboard/stats`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        this.totalCustomers = Number(data.totalCustomers || 0);
        this.totalDeposits = Number(data.totalDeposits || 0);
        this.activeLoans = Number(data.activeLoans || 0);
        this.monthlyEarnings = Number(data.monthlyEarnings || 0);
        if (data.customersPerMonth) {
          this.customersPerMonth = Object.keys(data.customersPerMonth).map(m => ({ month: m, count: data.customersPerMonth[m] }));
        }
        this.loanTypeDistribution = data.loanTypeDistribution || {};
        
        // Refresh charts with new data
        setTimeout(() => {
          this.initCharts();
        }, 50);
      } else {
        console.error('Failed to load dashboard stats:', res.status);
      }
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    }
  }

  ngAfterViewInit() {
    // Wait for data to load before initializing charts
    setTimeout(() => {
      this.initCharts();
    }, 100);
  }

  initCharts() {
    // Prepare data for charts
    const monthLabels = this.customersPerMonth.map(item => item.month);
    const monthCounts = this.customersPerMonth.map(item => item.count);
    
    // Bar Chart - Customers Per Month
    new Chart(this.barChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: monthLabels.length > 0 ? monthLabels : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'Customers',
          data: monthCounts.length > 0 ? monthCounts : [0, 0, 0, 0, 0, 0],
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(236, 72, 153, 0.8)',
            'rgba(34, 197, 94, 0.6)',
            'rgba(59, 130, 246, 0.6)'
          ],
          borderColor: [
            'rgba(34, 197, 94, 1)',
            'rgba(59, 130, 246, 1)',
            'rgba(139, 92, 246, 1)',
            'rgba(236, 72, 153, 1)',
            'rgba(34, 197, 94, 0.8)',
            'rgba(59, 130, 246, 0.8)'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: '#374151',
              font: {
                size: 14,
                weight: 'bold'
              }
            }
          }
        },
        scales: {
          x: {
            ticks: {
              color: '#374151',
              font: {
                size: 12,
                weight: 'bold'
              }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: '#374151',
              font: {
                size: 12,
                weight: 'bold'
              }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            }
          }
        }
      }
    });

    // Pie Chart - Loan Type Distribution
    const loanTypeLabels = Object.keys(this.loanTypeDistribution);
    const loanTypeCounts = Object.values(this.loanTypeDistribution);
    const colors = [
      'rgba(34, 197, 94, 0.8)',
      'rgba(59, 130, 246, 0.8)', 
      'rgba(139, 92, 246, 0.8)',
      'rgba(236, 72, 153, 0.8)',
      'rgba(34, 197, 94, 0.6)',
      'rgba(59, 130, 246, 0.6)'
    ];
    
    new Chart(this.pieChartRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: loanTypeLabels.length > 0 ? loanTypeLabels : ['No Data'],
        datasets: [{
          data: loanTypeCounts.length > 0 ? loanTypeCounts : [1],
          backgroundColor: loanTypeCounts.length > 0 ? colors.slice(0, loanTypeCounts.length) : ['rgba(156, 163, 175, 0.3)'],
          borderColor: loanTypeCounts.length > 0 ? colors.map(color => color.replace('0.8', '1')) : ['rgba(156, 163, 175, 0.5)'],
          borderWidth: 2
        }]
      },
      options: { 
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: {
            labels: {
              color: '#374151',
              font: {
                size: 14,
                weight: 'bold'
              }
            }
          }
        }
      }
    });

    // Line Chart
    new Chart(this.lineChartRef.nativeElement, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'Revenue (in ₹)',
          data: [20000, 25000, 27000, 30000, 28000, 35000],
          borderColor: 'rgba(34, 197, 94, 1)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointBackgroundColor: 'rgba(34, 197, 94, 1)',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: '#374151',
              font: {
                size: 14,
                weight: 'bold'
              }
            }
          }
        },
        scales: {
          x: {
            ticks: {
              color: '#374151',
              font: {
                size: 12,
                weight: 'bold'
              }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: '#374151',
              font: {
                size: 12,
                weight: 'bold'
              }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            }
          }
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

  logout(){
    this.router.navigateByUrl('/login');
    sessionStorage.clear();
  }

  onSidenavToggle(collapsed: boolean) {
    this.sidenavCollapsed = collapsed;
  }

}
