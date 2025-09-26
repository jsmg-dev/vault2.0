import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MainLayoutComponent } from '../../components/layout/main-layout.component';
import { BreadcrumbItem } from '../../components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, RouterModule, MainLayoutComponent],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  userRole: string = '';
  sidenavCollapsed = false;
  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Settings', route: '/settings' }
  ];

  settingsSections = [
    {
      title: 'Bill Setup',
      description: 'Configure billing settings and invoice templates',
      icon: 'fas fa-file-invoice-dollar',
      color: '#667eea',
      items: [
        {
          title: 'Configure',
          description: 'Set up company information, invoice settings, and automation',
          route: '/billing-config',
          icon: 'fas fa-cog'
        }
      ]
    },
    {
      title: 'User Management',
      description: 'Manage user accounts and permissions',
      icon: 'fas fa-users-cog',
      color: '#28a745',
      items: [
        {
          title: 'Manage Users',
          description: 'Add, edit, and manage user accounts',
          route: '/users',
          icon: 'fas fa-user-edit'
        }
      ]
    },
    {
      title: 'System Settings',
      description: 'Configure system-wide settings',
      icon: 'fas fa-cogs',
      color: '#6c757d',
      items: [
        {
          title: 'General Settings',
          description: 'Configure general application settings',
          route: '#',
          icon: 'fas fa-sliders-h',
          disabled: true
        }
      ]
    }
  ];

  constructor() {}

  ngOnInit() {
    this.userRole = sessionStorage.getItem('role') || '';
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
}
