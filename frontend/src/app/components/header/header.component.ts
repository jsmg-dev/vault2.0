import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BreadcrumbComponent, BreadcrumbItem } from '../breadcrumb/breadcrumb.component';
import { LanguageService, Language } from '../../services/language.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, BreadcrumbComponent],
  template: `
    <div class="header-section">
      <app-breadcrumb [items]="breadcrumbItems"></app-breadcrumb>
      
      <div class="header-actions">
        <ng-content select="[slot=actions]"></ng-content>
        
        <!-- Language Toggle -->
        <div class="language-toggle">
          <button 
            class="language-button" 
            (click)="toggleLanguage()" 
            [title]="'Switch to ' + getOtherLanguageName()"
          >
            <span class="language-flag">{{ getCurrentLanguageFlag() }}</span>
            <span class="language-code">{{ getCurrentLanguageCode() }}</span>
          </button>
        </div>
        
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
          {{ translate('common.logout') }}
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

    .language-toggle {
      position: relative;
    }

    .language-button {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      font-weight: 500;
    }

    .language-button:hover {
      background: #2563eb;
      transform: translateY(-1px);
    }

    .language-flag {
      font-size: 16px;
    }

    .language-code {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
  `]
})
export class HeaderComponent {
  @Input() breadcrumbItems: BreadcrumbItem[] = [];
  @Output() fullscreenToggle = new EventEmitter<void>();
  @Output() logoutEvent = new EventEmitter<void>();

  constructor(private languageService: LanguageService) {}

  toggleFullscreen() {
    this.fullscreenToggle.emit();
  }

  logout() {
    this.logoutEvent.emit();
  }

  toggleLanguage() {
    const currentLang = this.languageService.getCurrentLanguage();
    const newLang = currentLang === 'en' ? 'hi' : 'en';
    this.languageService.setLanguage(newLang);
  }

  getCurrentLanguageFlag(): string {
    const currentLang = this.languageService.getCurrentLanguage();
    const language = this.languageService.getLanguages().find(lang => lang.code === currentLang);
    return language?.flag || '🇺🇸';
  }

  getCurrentLanguageCode(): string {
    return this.languageService.getCurrentLanguage().toUpperCase();
  }

  getOtherLanguageName(): string {
    const currentLang = this.languageService.getCurrentLanguage();
    const otherLang = currentLang === 'en' ? 'hi' : 'en';
    const language = this.languageService.getLanguages().find(lang => lang.code === otherLang);
    return language?.name || 'English';
  }

  translate(key: string): string {
    return this.languageService.translate(key);
  }
}
