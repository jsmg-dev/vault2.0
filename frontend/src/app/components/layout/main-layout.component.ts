import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidenavComponent, NavItem } from '../sidenav/sidenav.component';
import { HeaderComponent } from '../header/header.component';
import { BreadcrumbItem } from '../breadcrumb/breadcrumb.component';
import { AiChatbotComponent } from '../../pages/ai-chatbot/ai-chatbot.component';
import { LanguageService } from '../../services/language.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SidenavComponent, HeaderComponent, AiChatbotComponent],
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
      
      <!-- Global AI Chatbot Widget -->
      <app-ai-chatbot></app-ai-chatbot>
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
export class MainLayoutComponent implements OnInit, OnDestroy {
  @Input() userRole: string = '';
  @Input() sidenavCollapsed: boolean = false;
  @Input() breadcrumbItems: BreadcrumbItem[] = [];
  
  @Output() sidenavToggle = new EventEmitter<boolean>();
  @Output() fullscreenToggle = new EventEmitter<void>();
  @Output() logoutEvent = new EventEmitter<void>();

  private languageSubscription: Subscription = new Subscription();

  // Centralized navigation items
  navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'fas fa-tachometer-alt', route: '/dashboard', roles: ['admin', 'user'] },
    { label: 'LIC Dashboard', icon: 'fas fa-chart-line', route: '/lic-dashboard', roles: ['admin', 'lic'] },
    { label: 'LIC Products', icon: 'fas fa-shield-alt', route: '/lic-products', roles: ['admin', 'lic'] },
    { label: 'LIC Premium Calculator', icon: 'fas fa-calculator', route: '/lic-premium-calculator', roles: ['admin', 'lic'] },
    { label: 'Customers', icon: 'fas fa-users', route: '/customers', roles: ['admin', 'user'] },
    { label: 'Deposits', icon: 'fas fa-piggy-bank', route: '/deposits', roles: ['admin', 'user'] },
    { label: 'LIC Policies', icon: 'fas fa-file-contract', route: '/policies', roles: ['admin', 'lic'] },
    { label: 'EMI Calculator', icon: 'fas fa-calculator', route: '/calculator', roles: ['admin', 'user'] },
    { label: 'ClothAura', icon: 'fas fa-tshirt', route: '/laundry', roles: ['admin', 'clothAura'] },
    { label: 'Reports', icon: 'fas fa-chart-bar', route: '/reports', roles: ['admin', 'user'] },
    { label: 'User Management', icon: 'fas fa-user-cog', route: '/users', roles: ['admin'] }
  ];

  constructor(private languageService: LanguageService) {}

  ngOnInit() {
    // Subscribe to language changes to update navigation labels
    this.languageSubscription = this.languageService.currentLanguage$.subscribe(() => {
      this.updateNavigationLabels();
    });
  }

  ngOnDestroy() {
    this.languageSubscription.unsubscribe();
  }

  private updateNavigationLabels() {
    this.navItems = [
      { label: this.languageService.translate('nav.dashboard'), icon: 'fas fa-tachometer-alt', route: '/dashboard', roles: ['admin', 'user'] },
      { label: 'LIC Dashboard', icon: 'fas fa-chart-line', route: '/lic-dashboard', roles: ['admin', 'lic'] },
      { label: 'LIC Products', icon: 'fas fa-shield-alt', route: '/lic-products', roles: ['admin', 'lic'] },
      { label: 'LIC Premium Calculator', icon: 'fas fa-calculator', route: '/lic-premium-calculator', roles: ['admin', 'lic'] },
      { label: this.languageService.translate('nav.customers'), icon: 'fas fa-users', route: '/customers', roles: ['admin', 'user'] },
      { label: this.languageService.translate('nav.deposits'), icon: 'fas fa-piggy-bank', route: '/deposits', roles: ['admin', 'user'] },
      { label: this.languageService.translate('nav.policies'), icon: 'fas fa-file-contract', route: '/policies', roles: ['admin', 'lic'] },
      { label: 'EMI Calculator', icon: 'fas fa-calculator', route: '/calculator', roles: ['admin', 'user'] },
      { label: this.languageService.translate('nav.clothaura'), icon: 'fas fa-tshirt', route: '/laundry', roles: ['admin', 'clothAura'] },
      { label: this.languageService.translate('nav.reports'), icon: 'fas fa-chart-bar', route: '/reports', roles: ['admin', 'user'] },
      { label: 'User Management', icon: 'fas fa-user-cog', route: '/users', roles: ['admin'] }
    ];
  }

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
