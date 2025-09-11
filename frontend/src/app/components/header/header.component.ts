import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BreadcrumbComponent, BreadcrumbItem } from '../breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, BreadcrumbComponent],
  template: `
    <div class="header-section">
      <app-breadcrumb [items]="breadcrumbItems"></app-breadcrumb>
      
      <div class="header-actions">
        <ng-content select="[slot=actions]"></ng-content>
        
        <button 
          class="btn-fullscreen" 
          (click)="toggleFullscreen()" 
          title="Toggle Fullscreen"
        >
          <i class="fas fa-expand"></i>
        </button>
        
        <button 
          class="logout-button" 
          (click)="logout()"
        >
          Logout
        </button>
      </div>
    </div>
  `,
  styles: [`
    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
      padding: 20px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .header-actions {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .btn-fullscreen {
      background: #6b7280;
      color: white;
      border: none;
      padding: 10px 12px;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .btn-fullscreen:hover {
      background: #4b5563;
    }

    .logout-button {
      background: #f44336;
      color: white;
      border: none;
      padding: 10px 16px;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
    }

    .logout-button:hover {
      background: #d32f2f;
    }
  `]
})
export class HeaderComponent {
  @Input() breadcrumbItems: BreadcrumbItem[] = [];
  @Output() fullscreenToggle = new EventEmitter<void>();
  @Output() logoutEvent = new EventEmitter<void>();

  toggleFullscreen() {
    this.fullscreenToggle.emit();
  }

  logout() {
    this.logoutEvent.emit();
  }
}
