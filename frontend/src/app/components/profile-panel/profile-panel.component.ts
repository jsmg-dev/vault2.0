import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { ToastService } from '../../services/toast.service';

interface UserProfile {
  id: number;
  name: string;
  username: string;
  role: string;
  email?: string;
  phone?: string;
  address?: string;
  profile_pic?: string;
  created_at?: string;
  last_login?: string;
}

@Component({
  selector: 'app-profile-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile-panel.component.html',
  styleUrl: './profile-panel.component.css'
})
export class ProfilePanelComponent implements OnInit {
  @Input() isOpen: boolean = false;
  @Output() close = new EventEmitter<void>();
  @ViewChild('profilePicInput') profilePicInput!: ElementRef<HTMLInputElement>;
  
  userProfile: UserProfile | null = null;
  selectedFile: File | null = null;
  isUploading = false;
  profilePicPreview: string | null = null;

  constructor(private toastService: ToastService) {}

  ngOnInit() {
    if (this.isOpen) {
      this.loadUserProfile();
    }
  }

  ngOnChanges() {
    if (this.isOpen && !this.userProfile) {
      this.loadUserProfile();
    }
  }

  async loadUserProfile() {
    const userId = sessionStorage.getItem('userId');
    if (!userId) return;

    try {
      // Get user data from user management
      const userResponse = await fetch(`${environment.apiUrl}/users/list`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!userResponse.ok) {
        throw new Error('Failed to load user data');
      }

      const userData = await userResponse.json();
      const currentUser = userData.find((user: any) => user.id == userId);
      
      if (currentUser) {
        this.userProfile = {
          id: currentUser.id,
          name: currentUser.name,
          username: currentUser.username,
          role: currentUser.role,
          email: currentUser.email || '',
          phone: currentUser.phone || '',
          address: currentUser.address || '',
          profile_pic: currentUser.profile_pic || '',
          created_at: currentUser.created_at,
          last_login: currentUser.last_login
        };
        
        // Set profile pic preview
        if (this.userProfile.profile_pic) {
          this.profilePicPreview = `${environment.apiUrl}/uploads/profile/${this.userProfile.profile_pic}`;
        }
        
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      this.toastService.show('Error loading profile', 'error');
    }
  }


  closePanel() {
    this.close.emit();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.toastService.show('Please select a valid image file', 'error');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.toastService.show('File size should be less than 5MB', 'error');
        return;
      }
      
      this.selectedFile = file;
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.profilePicPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  async uploadProfilePic() {
    if (!this.selectedFile || !this.userProfile) return;
    
    this.isUploading = true;
    const userId = this.userProfile.id;
    
    try {
      const formData = new FormData();
      formData.append('profile_pic', this.selectedFile);
      
      const response = await fetch(`${environment.apiUrl}/users/upload-profile-pic/${userId}`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload profile picture');
      }

      const data = await response.json();
      
      // Update local profile data
      if (this.userProfile) {
        this.userProfile.profile_pic = data.filename;
      }
      
      this.selectedFile = null;
      this.toastService.show('Profile picture updated successfully', 'success');
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      this.toastService.show('Error uploading profile picture', 'error');
    } finally {
      this.isUploading = false;
    }
  }

  removeProfilePic() {
    this.profilePicPreview = null;
    this.selectedFile = null;
  }

  triggerFileInput() {
    this.profilePicInput.nativeElement.click();
  }

  getRoleDisplayName(role: string): string {
    const roleMap: { [key: string]: string } = {
      'admin': 'Administrator',
      'user': 'User',
      'lic': 'LIC Agent',
      'clothAura': 'ClothAura'
    };
    return roleMap[role] || role;
  }

  getRoleBadgeClass(role: string): string {
    const classMap: { [key: string]: string } = {
      'admin': 'role-admin',
      'user': 'role-user',
      'lic': 'role-lic',
      'clothAura': 'role-clothaura'
    };
    return classMap[role] || 'role-user';
  }
}
