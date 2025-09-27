import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const allowedRoles: string[] = (route.data as any)?.roles || [];
  const role = sessionStorage.getItem('role');

  if (!role) {
    router.navigateByUrl('/login');
    return false;
  }
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    // Redirect based on user role
    if (role === 'lic') {
      router.navigateByUrl('/lic-dashboard');
    } else if (role === 'clothAura') {
      router.navigateByUrl('/laundry');
    } else {
      router.navigateByUrl('/dashboard');
    }
    return false;
  }
  return true;
};


