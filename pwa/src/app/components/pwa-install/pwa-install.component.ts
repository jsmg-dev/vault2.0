import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pwa-install',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pwa-install-banner" *ngIf="showInstallBanner">
      <div class="banner-content">
        <div class="banner-text">
          <i class="fas fa-download"></i>
          <span>Install Vault PWA for a better experience!</span>
        </div>
        <div class="banner-actions">
          <button class="btn-install" (click)="installPWA()">Install</button>
          <button class="btn-dismiss" (click)="dismissBanner()">×</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pwa-install-banner {
      position: fixed;
      bottom: 20px;
      left: 20px;
      right: 20px;
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      color: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(59, 130, 246, 0.3);
      z-index: 1000;
      animation: slideUp 0.3s ease-out;
    }

    .banner-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
    }

    .banner-text {
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 500;
    }

    .banner-text i {
      font-size: 20px;
    }

    .banner-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .btn-install {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-install:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .btn-dismiss {
      background: none;
      color: white;
      border: none;
      font-size: 24px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      transition: background 0.2s;
    }

    .btn-dismiss:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    @keyframes slideUp {
      from {
        transform: translateY(100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    @media (max-width: 768px) {
      .pwa-install-banner {
        left: 10px;
        right: 10px;
        bottom: 10px;
      }
      
      .banner-content {
        flex-direction: column;
        gap: 12px;
        text-align: center;
      }
      
      .banner-actions {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class PwaInstallComponent implements OnInit {
  showInstallBanner = false;
  private deferredPrompt: any;

  ngOnInit() {
    // Check if user dismissed the banner before
    if (localStorage.getItem('pwa-install-dismissed') === 'true') {
      this.showInstallBanner = false;
      return;
    }

    // Listen for the beforeinstallprompt event (Chrome/Edge)
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallBanner = true;
    });

    // Check if app is already installed
    window.addEventListener('appinstalled', () => {
      this.showInstallBanner = false;
      this.deferredPrompt = null;
      console.log('PWA was installed');
    });

    // Check if running in standalone mode (already installed)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.showInstallBanner = false;
    }

    // Safari-specific: Check if it's iOS Safari
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator as any).standalone;
    
    if (isIOS && !isInStandaloneMode) {
      // Show install banner for iOS Safari
      this.showInstallBanner = true;
    }
  }

  async installPWA() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      this.deferredPrompt = null;
      this.showInstallBanner = false;
    }
  }

  dismissBanner() {
    this.showInstallBanner = false;
    // Store dismissal in localStorage to prevent showing again
    localStorage.setItem('pwa-install-dismissed', 'true');
  }
}
