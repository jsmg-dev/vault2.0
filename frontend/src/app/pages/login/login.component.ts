import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  constructor(private router: Router, private toastService: ToastService) {}

  async onSubmit(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const payload = {
      username: String(formData.get('username') || ''),
      password: String(formData.get('password') || ''),
    };
    try {
      const res = await fetch(`${environment.apiUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Login failed');
      const data = await res.json();
      console.log(data);
      const role = data?.user?.role || data?.role || 'user';
      const userId = data?.user?.id || data?.id;
      console.log('Login - role from response:', role);
      console.log('Login - role type:', typeof role);
      console.log('Login - role === clothAura:', role === 'clothAura');
      sessionStorage.setItem('role', role);
      sessionStorage.setItem('userId', userId);
      console.log('Login - role stored in sessionStorage:', sessionStorage.getItem('role'));
      
      // Redirect based on user role
      if (role === 'lic') {
        this.router.navigateByUrl('/lic-dashboard');
      } else if (role === 'clothAura') {
        this.router.navigateByUrl('/laundry');
      } else {
        this.router.navigateByUrl('/dashboard');
      }
    } catch (e) {
      this.toastService.error('Invalid credentials');
    }
  }
}
