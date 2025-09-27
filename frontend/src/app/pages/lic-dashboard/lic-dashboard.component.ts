import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { MainLayoutComponent } from '../../components/layout/main-layout.component';
import { RouterModule } from '@angular/router';
import { BreadcrumbItem } from '../../components/breadcrumb/breadcrumb.component';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-lic-dashboard',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterModule, MainLayoutComponent],
  templateUrl: './lic-dashboard.component.html',
  styleUrls: ['./lic-dashboard.component.css']
})
export class LicDashboardComponent implements OnInit {
  userRole: string = '';
  sidenavCollapsed = false;
  isLoading = true;
  
  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', active: true }
  ];

  // Dashboard Data
  dashboardData = {
    totalPolicies: 0,
    activePolicies: 0,
    lapsedPolicies: 0,
    maturedPolicies: 0,
    totalPremiumCollected: 0,
    policiesDueToday: 0,
    policiesDueThisMonth: 0,
    recentPolicies: [] as any[],
    premiumDueToday: [] as any[],
    monthlyStats: [] as any[],
    policyTypes: {} as any
  };

  // Charts Data
  chartData = {
    monthlyPremium: [] as any[],
    policyStatus: [] as any[],
    policyTypes: [] as any[]
  };

  constructor(private http: HttpClient, public languageService: LanguageService) {}

  ngOnInit() {
    this.userRole = sessionStorage.getItem('role') || '';
    console.log('LIC Dashboard loaded, user role:', this.userRole);
    this.loadDashboardData();
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
    window.location.href = '/login';
  }

  loadDashboardData() {
    this.isLoading = true;
    
    // Load all dashboard metrics
    Promise.all([
      this.loadPolicyStats(),
      this.loadPremiumStats(),
      this.loadDueTodayPolicies(),
      this.loadMonthlyStats(),
      this.loadRecentPolicies(),
      this.loadChartData()
    ]).finally(() => {
      this.isLoading = false;
    });
  }

  loadPolicyStats() {
    return this.http.get<any[]>(`${environment.apiUrl}/policies/list`).toPromise()
      .then((policies: any) => {
        if (policies) {
          this.dashboardData.totalPolicies = policies.length;
          this.dashboardData.activePolicies = policies.filter((p: any) => p.status === 'Active').length;
          this.dashboardData.lapsedPolicies = policies.filter((p: any) => p.status === 'Lapsed').length;
          this.dashboardData.maturedPolicies = policies.filter((p: any) => p.status === 'Matured').length;
          
          // Policy types distribution
          this.dashboardData.policyTypes = policies.reduce((acc: any, policy: any) => {
            const plan = policy.plan_name || 'Unknown';
            acc[plan] = (acc[plan] || 0) + 1;
            return acc;
          }, {});
        }
      })
      .catch(error => {
        console.error('Error loading policy stats:', error);
      });
  }

  loadPremiumStats() {
    return this.http.get<any[]>(`${environment.apiUrl}/policies/list`).toPromise()
      .then((policies: any) => {
        if (policies) {
          this.dashboardData.totalPremiumCollected = policies
            .filter((p: any) => p.payment_status === 'paid')
            .reduce((sum: number, p: any) => sum + (parseFloat(p.premium) || 0), 0);
          
        }
      })
      .catch(error => {
        console.error('Error loading premium stats:', error);
      });
  }

  loadDueTodayPolicies() {
    return this.http.get<any>(`${environment.apiUrl}/api/policies/premium-due-today`).toPromise()
      .then((data: any) => {
        if (data) {
          this.dashboardData.policiesDueToday = data.count;
          this.dashboardData.premiumDueToday = data.policies || [];
        }
      })
      .catch(error => {
        console.error('Error loading due today policies:', error);
      });
  }

  loadMonthlyStats() {
    return this.http.get<any[]>(`${environment.apiUrl}/policies/list`).toPromise()
      .then((policies: any) => {
        if (policies) {
          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();
          
          // Count policies created this month
          this.dashboardData.policiesDueThisMonth = policies.filter((policy: any) => {
            if (!policy.next_premium_date) return false;
            const policyDate = new Date(policy.next_premium_date);
            return policyDate.getMonth() === currentMonth && 
                   policyDate.getFullYear() === currentYear;
          }).length;
        }
      })
      .catch(error => {
        console.error('Error loading monthly stats:', error);
      });
  }

  loadRecentPolicies() {
    return this.http.get<any[]>(`${environment.apiUrl}/policies/list`).toPromise()
      .then((policies: any) => {
        if (policies) {
          // Sort by created_at and take latest 5
          this.dashboardData.recentPolicies = policies
            .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5);
        }
      })
      .catch(error => {
        console.error('Error loading recent policies:', error);
      });
  }

  loadChartData() {
    return this.http.get<any[]>(`${environment.apiUrl}/policies/list`).toPromise()
      .then((policies: any) => {
        if (policies) {
          // Monthly premium data (last 6 months)
          const monthlyData = this.getLast6MonthsData(policies);
          this.chartData.monthlyPremium = monthlyData;

          // Policy status distribution
          this.chartData.policyStatus = [
            { label: 'Active', value: this.dashboardData.activePolicies, color: '#4CAF50' },
            { label: 'Lapsed', value: this.dashboardData.lapsedPolicies, color: '#f44336' },
            { label: 'Matured', value: this.dashboardData.maturedPolicies, color: '#2196F3' }
          ];

          // Policy types distribution
          this.chartData.policyTypes = Object.entries(this.dashboardData.policyTypes)
            .map(([label, value]: [string, any]) => ({ label, value }));
        }
      })
      .catch(error => {
        console.error('Error loading chart data:', error);
      });
  }

  getLast6MonthsData(policies: any[]) {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      const monthPolicies = policies.filter(p => {
        if (!p.created_at) return false;
        const policyDate = new Date(p.created_at);
        return policyDate.getMonth() === month.getMonth() && 
               policyDate.getFullYear() === month.getFullYear();
      });
      
      months.push({
        month: monthStr,
        count: monthPolicies.length,
        premium: monthPolicies.reduce((sum, p) => sum + (parseFloat(p.premium) || 0), 0)
      });
    }
    
    return months;
  }

  sendWhatsAppNotification(policyId: number) {
    this.http.post(`${environment.apiUrl}/api/whatsapp/send-to-policy/${policyId}`, {}).subscribe({
      next: (response: any) => {
        if (response.success) {
          alert('WhatsApp notification sent successfully!');
        } else {
          alert('Failed to send WhatsApp notification: ' + (response.error || 'Unknown error'));
        }
      },
      error: (error) => {
        console.error('Error sending WhatsApp notification:', error);
        alert('Error sending WhatsApp notification');
      }
    });
  }

  sendAllDueNotifications() {
    if (confirm('Send WhatsApp notifications to all policies due today?')) {
      this.http.post(`${environment.apiUrl}/api/whatsapp/send-premium-due-notifications`, {}).subscribe({
        next: (response: any) => {
          alert(`Notifications sent: ${response.successCount}/${response.count} successful`);
          this.loadDueTodayPolicies(); // Refresh the data
        },
        error: (error) => {
          console.error('Error sending notifications:', error);
          alert('Error sending notifications');
        }
      });
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN');
  }

  getMaxPremium(): number {
    if (!this.chartData.monthlyPremium || this.chartData.monthlyPremium.length === 0) {
      return 1;
    }
    return Math.max(...this.chartData.monthlyPremium.map((m: any) => m.premium || 0));
  }
}
