import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BreadcrumbComponent, BreadcrumbItem } from '../breadcrumb/breadcrumb.component';
import { LanguageService, Language } from '../../services/language.service';
import { environment } from '../../../environments/environment';

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
        
        <!-- Profile Icon -->
        <button 
          class="profile-button" 
          (click)="toggleProfile()" 
          title="Profile"
        >
          <div class="profile-avatar">
            <img 
              *ngIf="userProfilePic" 
              [src]="userProfilePic" 
              [alt]="'Profile Picture'"
              class="profile-image"
            >
            <i *ngIf="!userProfilePic" class="fas fa-user"></i>
          </div>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 5px;
      padding: 8px 15px;
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

    .profile-button {
      background: #3b82f6;
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

    .profile-button:hover {
      background: #2563eb;
    }

    .profile-button i {
      font-size: 16px;
    }

    .profile-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.2);
    }

    .profile-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 50%;
    }
  `]
})
export class HeaderComponent implements OnInit {
  @Input() breadcrumbItems: BreadcrumbItem[] = [];
  @Output() fullscreenToggle = new EventEmitter<void>();
  @Output() logoutEvent = new EventEmitter<void>();
  @Output() profileToggle = new EventEmitter<void>();

  userProfilePic: string | null = null;

  constructor(private languageService: LanguageService) {}

  ngOnInit() {
    this.loadUserProfilePic();
  }

  // Method to refresh profile picture (can be called from parent component)
  refreshProfilePic() {
    this.loadUserProfilePic();
  }

  async loadUserProfilePic() {
    const userId = sessionStorage.getItem('userId');
    if (!userId) {
      console.log('Header: No userId found in sessionStorage');
      return;
    }

    console.log('Header: Loading profile picture for user ID:', userId);

    try {
      const response = await fetch(`${environment.apiUrl}/users/profile/${userId}`, {
        method: 'GET',
        credentials: 'include'
      });

      console.log('Header: Profile API response status:', response.status);

      if (response.ok) {
        const responseData = await response.json();
        console.log('Header: Profile API response data:', responseData);
        
        const userData = responseData.user || responseData; // Handle both wrapped and direct responses
        console.log('Header: User data:', userData);
        
        if (userData.profile_pic) {
          // Add timestamp to prevent caching issues
          this.userProfilePic = `${environment.apiUrl}/uploads/profile/${userData.profile_pic}?t=${Date.now()}`;
          console.log('Header: Profile picture URL set:', this.userProfilePic);
        } else {
          console.log('Header: No profile picture found for user');
        }
      } else {
        console.error('Header: Profile API error:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Header: Error loading user profile picture:', error);
    }
  }

  toggleFullscreen() {
    this.fullscreenToggle.emit();
  }

  toggleProfile() {
    this.profileToggle.emit();
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
