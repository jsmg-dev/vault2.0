import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidenavComponent, NavItem } from '../sidenav/sidenav.component';
import { HeaderComponent } from '../header/header.component';
import { BreadcrumbItem } from '../breadcrumb/breadcrumb.component';
import { PwaInstallComponent } from '../pwa-install/pwa-install.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SidenavComponent, HeaderComponent, PwaInstallComponent],
  template: `
    <div class="main-layout">
      <app-sidenav 
        [collapsed]="sidenavCollapsed" 
        [userRole]="userRole" 
        [navItems]="navItems"
        (toggle)="onSidenavToggle($event)"
      ></app-sidenav>

      <div class="content-area" [class.sidenav-collapsed]="sidenavCollapsed">
        <app-header 
          [breadcrumbItems]="breadcrumbItems"
          (fullscreenToggle)="onFullscreenToggle()"
          (logoutEvent)="onLogout()"
        ></app-header>

        <div class="page-content">
          <ng-content></ng-content>
        </div>
      </div>
      
      <!-- PWA Install Banner -->
      <app-pwa-install></app-pwa-install>
    </div>
  `,
  styles: [`
    .main-layout {
      display: flex;
      height: 100vh;
      background: #f5f7fa;
      overflow: hidden;
    }

    .content-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
    }

    .page-content {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 0;
      margin: 0;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .content-area {
        /* No margins needed */
      }
    }
  `]
})
export class MainLayoutComponent {
  @Input() userRole: string = '';
  @Input() sidenavCollapsed: boolean = false;
  @Input() breadcrumbItems: BreadcrumbItem[] = [];
  
  @Output() sidenavToggle = new EventEmitter<boolean>();
  @Output() fullscreenToggle = new EventEmitter<void>();
  @Output() logoutEvent = new EventEmitter<void>();

  // Centralized navigation items
  navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'fas fa-tachometer-alt', route: '/dashboard', roles: ['admin', 'user', 'lic'] },
    { label: 'Customers', icon: 'fas fa-users', route: '/customers', roles: ['admin', 'user'] },
    { label: 'Deposits', icon: 'fas fa-piggy-bank', route: '/deposits', roles: ['admin', 'user'] },
    { label: 'LIC Policies', icon: 'fas fa-file-contract', route: '/policies', roles: ['admin', 'user', 'lic'] },
    { label: 'EMI Calculator', icon: 'fas fa-calculator', route: '/calculator', roles: ['admin', 'user'] },
    { label: 'Reports', icon: 'fas fa-chart-bar', route: '/reports', roles: ['admin', 'user'] },
    { label: 'User Management', icon: 'fas fa-user-cog', route: '/users', roles: ['admin'] }
  ];

  onSidenavToggle(collapsed: boolean) {
    this.sidenavCollapsed = collapsed;
    this.sidenavToggle.emit(collapsed);
  }

  onFullscreenToggle() {
    this.fullscreenToggle.emit();
  }

  onLogout() {
    this.logoutEvent.emit();
  }
}
