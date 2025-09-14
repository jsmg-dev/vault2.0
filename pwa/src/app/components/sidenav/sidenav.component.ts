import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

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
        </button>
      </div>
    </div>
  `,
  styles: [`
    .sidenav {
      width: 250px;
      height: 100vh;
      background: #1f2a44;
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
      height: 135px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      position: relative;
      box-sizing: border-box;
    }

    .logo {
      width: calc(100% - 4px);
      height: calc(100% - 4px);
      object-fit: contain;
      object-position: center;
      transition: all 0.3s ease;
      max-width: 100%;
      max-height: 100%;
      margin-right: 35px;
    }

    .logo.logo-small {
      width: calc(100% - 4px);
      height: calc(100% - 4px);
      object-fit: contain;
      object-position: center;
    }

    .logo-text {
      font-size: 20px;
      font-weight: bold;
      color: white;
    }

    .nav-items {
      flex: 1;
      padding: 20px 0;
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
      border-left-color: #3b82f6;
    }

    .nav-item.active {
      background: rgba(59, 130, 246, 0.2);
      border-left-color: #3b82f6;
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
    }

    .toggle-btn {
      width: 100%;
      background: rgba(255, 255, 255, 0.1);
      border: none;
      color: white;
      padding: 12px;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .toggle-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .toggle-btn i {
      font-size: 16px;
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
export class SidenavComponent {
  @Input() collapsed: boolean = false;
  @Input() userRole: string = '';
  @Input() navItems: NavItem[] = [];
  @Output() toggle = new EventEmitter<boolean>();

  get filteredNavItems(): NavItem[] {
    if (!this.userRole) return this.navItems;
    return this.navItems.filter(item => 
      !item.roles || item.roles.includes(this.userRole)
    );
  }

  toggleCollapse() {
    this.collapsed = !this.collapsed;
    this.toggle.emit(this.collapsed);
  }
}
