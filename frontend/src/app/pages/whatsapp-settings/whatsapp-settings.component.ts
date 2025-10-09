import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MainLayoutComponent } from '../../components/layout/main-layout.component';
import { BreadcrumbItem } from '../../components/breadcrumb/breadcrumb.component';
import { ToastService } from '../../services/toast.service';
import { LanguageService } from '../../services/language.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-whatsapp-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent],
  templateUrl: './whatsapp-settings.component.html',
  styleUrl: './whatsapp-settings.component.css'
})
export class WhatsappSettingsComponent implements OnInit, OnDestroy {
  userRole: string = '';
  sidenavCollapsed = false;
  breadcrumbItems: BreadcrumbItem[] = [];
  private languageSubscription: Subscription = new Subscription();

  constructor(
    private router: Router,
    private toastService: ToastService,
    private languageService: LanguageService
  ) {}

  ngOnInit() {
    this.userRole = sessionStorage.getItem('role') || '';
    
    // Subscribe to language changes
    this.languageSubscription = this.languageService.currentLanguage$.subscribe(() => {
      this.updateBreadcrumbItems();
    });
    
    this.updateBreadcrumbItems();
  }

  ngOnDestroy() {
    this.languageSubscription.unsubscribe();
  }

  private updateBreadcrumbItems() {
    this.breadcrumbItems = [
      { label: this.languageService.translate('nav.settings'), route: '/whatsapp-settings' }
    ];
  }

  translate(key: string): string {
    return this.languageService.translate(key);
  }

  onSidenavToggle(collapsed: boolean) {
    this.sidenavCollapsed = collapsed;
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  logout() {
    sessionStorage.clear();
    this.router.navigate(['/login']);
  }

  openBillSetupModal() {
    // Navigate to billing configuration page
    this.router.navigate(['/billing-config']);
  }

  openNotificationsModal() {
    this.toastService.info('Notifications functionality coming soon');
  }

  openAppearanceModal() {
    this.toastService.info('Appearance customization coming soon');
  }
}


