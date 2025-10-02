import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidenavComponent, NavItem } from '../sidenav/sidenav.component';
import { HeaderComponent } from '../header/header.component';
import { BreadcrumbItem } from '../breadcrumb/breadcrumb.component';
// Removed AISHAComponent import - now only in sidebar
import { ProfilePanelComponent } from '../profile-panel/profile-panel.component';
import { LanguageService } from '../../services/language.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SidenavComponent, HeaderComponent, ProfilePanelComponent],
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
          #headerComponent
          [breadcrumbItems]="breadcrumbItems"
          (fullscreenToggle)="onFullscreenToggle()"
          (logoutEvent)="onLogout()"
          (profileToggle)="onProfileToggle()"
        ></app-header>

        <div class="page-content">
          <ng-content></ng-content>
        </div>
      </div>
      
      <!-- Global AISHA Widget -->
      <!-- AISHA removed from global layout - now only in sidebar -->
      
      <!-- Profile Panel -->
      <app-profile-panel 
        [isOpen]="isProfileOpen" 
        (close)="onProfileClose()"
      ></app-profile-panel>
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
  @ViewChild('headerComponent') headerComponent!: HeaderComponent;
  
  @Output() sidenavToggle = new EventEmitter<boolean>();
  @Output() fullscreenToggle = new EventEmitter<void>();
  @Output() logoutEvent = new EventEmitter<void>();

  private languageSubscription: Subscription = new Subscription();
  isProfileOpen = false;

  // Centralized navigation items
  navItems: NavItem[] = [];

  constructor(private languageService: LanguageService) {}

  ngOnInit() {
    // Initialize navigation items
    this.initializeNavigationItems();
    
    // Subscribe to language changes to update navigation labels
    this.languageSubscription = this.languageService.currentLanguage$.subscribe(() => {
      this.updateNavigationLabels();
    });
  }

  private initializeNavigationItems() {
    this.navItems = [
      { label: this.languageService.translate('nav.dashboard'), icon: 'fas fa-tachometer-alt', route: '/dashboard', roles: ['admin', 'user'] },
      { label: this.languageService.translate('nav.dashboard'), icon: 'fas fa-chart-line', route: '/lic-dashboard', roles: ['admin', 'lic'] },
      { label: this.languageService.translate('nav.product_details'), icon: 'fas fa-shield-alt', route: '/lic-products', roles: ['admin', 'lic'] },
      { label: this.languageService.translate('nav.premium_calculator'), icon: 'fas fa-calculator', route: '/lic-premium-calculator', roles: ['admin', 'lic'] },
      { label: this.languageService.translate('nav.customers'), icon: 'fas fa-users', route: '/customers', roles: ['admin', 'user'] },
      { label: this.languageService.translate('nav.deposits'), icon: 'fas fa-piggy-bank', route: '/deposits', roles: ['admin', 'user'] },
      { label: this.languageService.translate('nav.policies'), icon: 'fas fa-file-contract', route: '/policies', roles: ['admin', 'lic'] },
      { label: this.languageService.translate('nav.emi_calculator'), icon: 'fas fa-calculator', route: '/calculator', roles: ['admin', 'user'] },
      { label: this.languageService.translate('nav.clothaura'), icon: 'fas fa-tshirt', route: '/laundry', roles: ['admin', 'clothAura'] },
      { label: this.languageService.translate('nav.reports'), icon: 'fas fa-chart-bar', route: '/reports', roles: ['admin', 'user'] },
      { label: this.languageService.translate('nav.user_management'), icon: 'fas fa-user-cog', route: '/users', roles: ['admin'] },
      { label: 'AISHA', icon: 'fas fa-robot', route: '/aisha', roles: ['admin', 'lic'] },
    ];
    console.log('MainLayout - Initialized navItems:', this.navItems);
  }

  ngOnDestroy() {
    this.languageSubscription.unsubscribe();
  }

  private updateNavigationLabels() {
    this.navItems = [
      { label: this.languageService.translate('nav.dashboard'), icon: 'fas fa-tachometer-alt', route: '/dashboard', roles: ['admin', 'user'] },
      { label: this.languageService.translate('nav.dashboard'), icon: 'fas fa-chart-line', route: '/lic-dashboard', roles: ['admin', 'lic'] },
      { label: this.languageService.translate('nav.product_details'), icon: 'fas fa-shield-alt', route: '/lic-products', roles: ['admin', 'lic'] },
      { label: this.languageService.translate('nav.premium_calculator'), icon: 'fas fa-calculator', route: '/lic-premium-calculator', roles: ['admin', 'lic'] },
      { label: this.languageService.translate('nav.customers'), icon: 'fas fa-users', route: '/customers', roles: ['admin', 'user'] },
      { label: this.languageService.translate('nav.deposits'), icon: 'fas fa-piggy-bank', route: '/deposits', roles: ['admin', 'user'] },
      { label: this.languageService.translate('nav.policies'), icon: 'fas fa-file-contract', route: '/policies', roles: ['admin', 'lic'] },
      { label: this.languageService.translate('nav.emi_calculator'), icon: 'fas fa-calculator', route: '/calculator', roles: ['admin', 'user'] },
      { label: this.languageService.translate('nav.clothaura'), icon: 'fas fa-tshirt', route: '/laundry', roles: ['admin', 'clothAura'] },
      { label: this.languageService.translate('nav.reports'), icon: 'fas fa-chart-bar', route: '/reports', roles: ['admin', 'user'] },
      { label: this.languageService.translate('nav.user_management'), icon: 'fas fa-user-cog', route: '/users', roles: ['admin'] },
      { label: 'AISHA', icon: 'fas fa-robot', route: '/aisha', roles: ['admin', 'lic'] },
    ];
    console.log('MainLayout - Updated navItems:', this.navItems);
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

  onProfileToggle() {
    this.isProfileOpen = true;
  }

  onProfileClose() {
    this.isProfileOpen = false;
    // Refresh the profile picture in header after profile panel is closed
    if (this.headerComponent) {
      this.headerComponent.refreshProfilePic();
    }
  }
}
