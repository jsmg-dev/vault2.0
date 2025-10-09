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
        [userName]="userName"
        [profilePicture]="profilePicture"
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

  // User profile information
  userName: string = 'User';
  profilePicture: string = '';

  constructor(private languageService: LanguageService) {}

  ngOnInit() {
    // Initialize navigation items
    this.initializeNavigationItems();
    
    // Load user profile information
    this.loadUserProfile();
    
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
      { label: this.languageService.translate('nav.settings'), icon: 'fas fa-cog', route: '/whatsapp-settings', roles: ['admin', 'clothAura'] },
      { label: this.languageService.translate('nav.reports'), icon: 'fas fa-chart-bar', route: '/reports', roles: ['admin', 'user'] },
      { label: this.languageService.translate('nav.user_management'), icon: 'fas fa-user-cog', route: '/users', roles: ['admin'] },
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
      { label: this.languageService.translate('nav.settings'), icon: 'fas fa-cog', route: '/whatsapp-settings', roles: ['admin', 'clothAura'] },
      { label: this.languageService.translate('nav.reports'), icon: 'fas fa-chart-bar', route: '/reports', roles: ['admin', 'user'] },
      { label: this.languageService.translate('nav.user_management'), icon: 'fas fa-user-cog', route: '/users', roles: ['admin'] },
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
    // Reload user profile to update sidebar picture
    this.loadUserProfile();
  }

  async loadUserProfile() {
    // Get user info from session storage
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.userName = user.name || user.username || 'User';
        
        // Fetch profile picture from backend
        if (user.id) {
          try {
            const response = await fetch(`http://localhost:8080/api/users/profile/${user.id}`, {
              credentials: 'include'
            });
            
            if (response.ok) {
              const userData = await response.json();
              console.log('User data from API:', userData);
              
              // Check if user has a profile picture
              if (userData.profile_pic) {
                const timestamp = new Date().getTime();
                this.profilePicture = `http://localhost:8080/uploads/profile/${userData.profile_pic}?t=${timestamp}`;
                console.log('Setting profile picture URL:', this.profilePicture);
              } else {
                this.profilePicture = '';
                console.log('No profile picture found in database');
              }
            } else {
              console.error('API response not OK:', response.status);
              this.profilePicture = '';
            }
          } catch (error) {
            console.error('Error fetching user profile from API:', error);
            this.profilePicture = '';
          }
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
      }
    }
  }

  async onProfilePictureChange(file: File) {
    // Get user info
    const userStr = sessionStorage.getItem('user');
    if (!userStr) return;

    const user = JSON.parse(userStr);
    const userId = user.id;

    // Upload profile picture
    const formData = new FormData();
    formData.append('profile_pic', file);

    try {
      const response = await fetch(`http://localhost:8080/api/users/upload-profile-pic/${userId}`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const data = await response.json();
      console.log('Upload response:', data);
      
      if (response.ok && data.profile_pic) {
        // Reload profile to get the updated picture
        await this.loadUserProfile();
        console.log('Profile picture uploaded and sidebar updated');
      } else {
        console.error('Upload failed:', data);
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
    }
  }
}
