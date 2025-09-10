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
      sessionStorage.setItem('role', role);
      this.router.navigateByUrl('/dashboard');
    } catch (e) {
      this.toastService.error('Invalid credentials');
    }
  }
}
