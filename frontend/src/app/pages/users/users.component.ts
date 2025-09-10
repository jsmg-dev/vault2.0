import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit {
  users: any[] = [];
  filteredUsers: any[] = [];
  selectedUsers: number[] = [];
  selectAllChecked = false;
  showModal = false;
  editingUser: any = null;
  userForm: any = {};
  
  totalUsers = 0;
  adminUsers = 0;
  activeUsers = 0;

  async ngOnInit() {
    await this.loadUsers();
    this.calculateStats();
  }

  async loadUsers() {
    try {
      const res = await fetch(`${environment.apiUrl}/users/list`, { credentials: 'include' });
      this.users = await res.json();
      this.filteredUsers = [...this.users];
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  }

  calculateStats() {
    this.totalUsers = this.users.length;
    this.adminUsers = this.users.filter(u => u.role === 'admin').length;
    this.activeUsers = this.users.filter(u => u.status !== 'inactive').length;
  }

  filterUsers(event: any) {
    const searchTerm = event.target.value.toLowerCase();
    this.filteredUsers = this.users.filter(user =>
      user.id?.toString().includes(searchTerm) ||
      user.name?.toLowerCase().includes(searchTerm) ||
      user.username?.toLowerCase().includes(searchTerm) ||
      user.role?.toLowerCase().includes(searchTerm)
    );
  }

  openCreateModal() {
    this.editingUser = null;
    this.userForm = {
      role: 'user',
      status: 'active',
      password: ''   // ✅ needed for backend
    };
    this.showModal = true;
  }

  editUser(user: any) {
    console.log(user);
    this.editingUser = user;
    this.userForm = { ...user };
    delete this.userForm.password; // Don't show password in edit
    if (!this.userForm.status) {
      this.userForm.status = 'active'; // ✅ fallback
    }
    this.showModal = true;
  }

  viewUser(user: any) {
    // For now, just show user details in an alert
    alert(`User Details:\nID: ${user.id}\nName: ${user.name}\nUsername: ${user.username}\nRole: ${user.role}\nStatus: ${user.status || 'active'}`);
  }

  closeModal() {
    this.showModal = false;
    this.editingUser = null;
    this.userForm = {};
  }

  async saveUser(event: Event) {
    event.preventDefault();
    
    try {
      const url = this.editingUser 
        ? `${environment.apiUrl}/users/update/${this.editingUser.id}`
        : `${environment.apiUrl}/users/create`;
      
      const method = this.editingUser ? 'PUT' : 'POST';
      console.log(method, this.editingUser);
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.userForm),
        credentials: 'include'
      });
      
      if (res.ok) {
        alert(this.editingUser ? 'User updated!' : 'User created!');
        this.closeModal();
        await this.loadUsers();
        this.calculateStats();
      } else {
        alert('Operation failed');
      }
    } catch (err) {
      alert('Operation failed');
    }
  }

  async deleteUser(id: number) {
    if (confirm('Delete this user?')) {
      try {
        const res = await fetch(`${environment.apiUrl}/users/delete/${id}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        if (res.ok) {
          await this.loadUsers();
          this.calculateStats();
        }
      } catch (err) {
        alert('Delete failed');
      }
    }
  }

  toggleSelection(id: number) {
    const index = this.selectedUsers.indexOf(id);
    if (index > -1) {
      this.selectedUsers.splice(index, 1);
    } else {
      this.selectedUsers.push(id);
    }
    this.updateSelectAllState();
  }

  selectAll(event: any) {
    if (event.target.checked) {
      this.selectedUsers = this.filteredUsers.map(u => u.id);
    } else {
      this.selectedUsers = [];
    }
    this.selectAllChecked = event.target.checked;
  }

  updateSelectAllState() {
    this.selectAllChecked = this.selectedUsers.length === this.filteredUsers.length;
  }

  async deleteSelected() {
    if (this.selectedUsers.length === 0) return;
    
    if (confirm(`Delete ${this.selectedUsers.length} selected users?`)) {
      try {
        const res = await fetch(`${environment.apiUrl}/users/delete-multiple`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: this.selectedUsers }),
          credentials: 'include'
        });
        
        if (res.ok) {
          this.selectedUsers = [];
          await this.loadUsers();
          this.calculateStats();
        }
      } catch (err) {
        alert('Delete failed');
      }
    }
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }
}
