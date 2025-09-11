import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface BreadcrumbItem {
  label: string;
  route?: string;
  active?: boolean;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="breadcrumb">
      <ng-container *ngFor="let item of items; let last = last">
        <a 
          *ngIf="item.route && !last" 
          [routerLink]="item.route" 
          class="breadcrumb-item"
        >
          {{ item.label }}
        </a>
        <span 
          *ngIf="!item.route || last" 
          [class]="last ? 'breadcrumb-current' : 'breadcrumb-item'"
        >
          {{ item.label }}
        </span>
        <span *ngIf="!last" class="breadcrumb-separator">/</span>
      </ng-container>
    </div>
  `,
  styles: [`
    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
    }

    .breadcrumb-item {
      color: #3b82f6;
      text-decoration: none;
      transition: color 0.2s;
    }

    .breadcrumb-item:hover {
      color: #1d4ed8;
    }

    .breadcrumb-separator {
      color: #9ca3af;
    }

    .breadcrumb-current {
      font-size: 30px;
      color: #374151;
      font-weight: 600;
    }
  `]
})
export class BreadcrumbComponent {
  @Input() items: BreadcrumbItem[] = [];
}
