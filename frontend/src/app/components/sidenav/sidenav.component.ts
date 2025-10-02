import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LanguageService } from '../../services/language.service';
import { Subscription } from 'rxjs';

export interface NavItem {
  label: string;
  route: string;
  icon: string;
  roles?: string[];
}

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="sidenav" [class.collapsed]="collapsed">
      <div class="sidenav-header">
        <img 
          src="assets/images/Vaultlogo5_cropped.png" 
          alt="Vault Logo" 
          class="logo"
          [class.logo-small]="collapsed"
        />
        <div class="powered-by" [class.hidden]="collapsed">
          <span>Powered by SBBF</span>
        </div>
      </div>
      
      <div class="nav-items">
        <a 
          *ngFor="let item of filteredNavItems" 
          [routerLink]="item.route"
          routerLinkActive="active"
          class="nav-item"
          [class.collapsed]="collapsed"
          [title]="collapsed ? item.label : ''"
        >
          <i [class]="item.icon"></i>
          <span class="nav-label" *ngIf="!collapsed">{{ item.label }}</span>
        </a>
      </div>
      
      <div class="sidenav-footer">
        <button 
          class="toggle-btn" 
          (click)="toggleCollapse()"
          [title]="collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'"
        >
          <i [class]="collapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-left'"></i>
          <span *ngIf="!collapsed" class="toggle-text">
            {{ collapsed ? 'Expand' : 'Collapse' }}
          </span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .sidenav {
      width: 250px;
      height: 100vh;
      background: #374151;
      color: white;
      display: flex;
      flex-direction: column;
      transition: width 0.3s ease;
      box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
    }

    .sidenav.collapsed {
      width: 70px;
    }

    .sidenav-header {
      height: 140px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      position: relative;
      box-sizing: border-box;
      padding: 10px;
    }


    .logo {
      width: calc(100% - 4px);
      height: calc(100% - 4px);
      object-fit: contain;
      object-position: center;
      transition: all 0.3s ease;
      max-width: 100%;
      max-height: 100%;
      margin-bottom: 0;
    }

    .logo.logo-small {
      width: calc(100% - 4px);
      height: calc(100% - 4px);
      object-fit: contain;
      object-position: center;
      margin-bottom: 0;
    }

    .powered-by {
      text-align: center;
      transition: opacity 0.3s ease;
    }

    .powered-by span {
      font-size: 8px;
      color: rgba(255, 255, 255, 0.7);
      font-weight: 500;
      letter-spacing: 0.3px;
    }

    .powered-by.hidden {
      opacity: 0;
      height: 0;
      overflow: hidden;
    }

    .logo-text {
      font-size: 20px;
      font-weight: bold;
      color: white;
    }

    .nav-items {
      flex: 1;
      padding: 20px 0;
      overflow-y: auto;
      max-height: calc(100vh - 200px);
    }

    /* Custom scrollbar for nav-items */
    .nav-items::-webkit-scrollbar {
      width: 6px;
    }

    .nav-items::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
    }

    .nav-items::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.3);
      border-radius: 3px;
    }

    .nav-items::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.5);
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 15px 20px;
      color: white;
      text-decoration: none;
      transition: all 0.3s ease;
      border-left: 3px solid transparent;
    }

    .nav-item:hover {
      background: rgba(255, 255, 255, 0.1);
      border-left-color: #ef4444;
    }

    .nav-item.active {
      background: rgba(239, 68, 68, 0.2);
      border-left-color: #ef4444;
    }

    .nav-item.collapsed {
      justify-content: center;
      padding: 15px;
    }

    .nav-item i {
      font-size: 18px;
      width: 20px;
      text-align: center;
    }

    .nav-label {
      font-weight: 500;
      transition: opacity 0.3s ease;
    }

    .sidenav-footer {
      padding: 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      position: sticky;
      bottom: 0;
      background: #374151;
      z-index: 10;
    }

    .toggle-btn {
      width: 100%;
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: rgba(255, 255, 255, 0.8);
      padding: 8px 12px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 500;
    }

    .toggle-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.3);
      color: white;
    }

    .toggle-btn:active {
      background: rgba(255, 255, 255, 0.15);
    }

    .toggle-btn i {
      font-size: 12px;
      margin-right: 8px;
    }

    .toggle-text {
      font-size: 13px;
      font-weight: 500;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .sidenav {
        width: 70px;
      }
      
      .sidenav:not(.collapsed) {
        position: fixed;
        z-index: 1000;
        width: 250px;
      }
    }
  `]
})
export class SidenavComponent implements OnInit, OnDestroy {
  @Input() collapsed: boolean = false;
  @Input() userRole: string = '';
  @Input() navItems: NavItem[] = [];
  @Output() toggle = new EventEmitter<boolean>();

  private languageSubscription: Subscription = new Subscription();

  constructor(private languageService: LanguageService) {}

  ngOnInit() {
    // Subscribe to language changes to update navigation labels
    this.languageSubscription = this.languageService.currentLanguage$.subscribe(() => {
      // Navigation items are updated by the parent component (main-layout)
      // This subscription ensures the component reacts to language changes
    });
  }

  ngOnDestroy() {
    this.languageSubscription.unsubscribe();
  }

  get filteredNavItems(): NavItem[] {
    console.log('Sidenav - userRole:', this.userRole);
    console.log('Sidenav - userRole type:', typeof this.userRole);
    console.log('Sidenav - navItems:', this.navItems);
    
    if (!this.userRole) {
      console.log('Sidenav - No userRole, returning all items');
      return this.navItems;
    }
    
    const filtered = this.navItems.filter(item => {
      const hasAccess = !item.roles || item.roles.includes(this.userRole);
      console.log(`Sidenav - Item "${item.label}": roles=${JSON.stringify(item.roles)}, userRole="${this.userRole}", hasAccess=${hasAccess}`);
      return hasAccess;
    });
    
    console.log('Sidenav - filtered items:', filtered);
    return filtered;
  }

  toggleCollapse() {
    this.collapsed = !this.collapsed;
    this.toggle.emit(this.collapsed);
  }
}
