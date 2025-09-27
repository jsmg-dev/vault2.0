import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const allowedRoles: string[] = (route.data as any)?.roles || [];
  const role = sessionStorage.getItem('role');

  console.log('AuthGuard - route:', route.routeConfig?.path);
  console.log('AuthGuard - allowedRoles:', allowedRoles);
  console.log('AuthGuard - role from sessionStorage:', role);
  console.log('AuthGuard - role type:', typeof role);
  console.log('AuthGuard - role === clothAura:', role === 'clothAura');
  console.log('AuthGuard - allowedRoles.includes(role):', role ? allowedRoles.includes(role) : false);

  if (!role) {
    console.log('AuthGuard - No role, redirecting to login');
    router.navigateByUrl('/login');
    return false;
  }
  if (allowedRoles.length > 0 && role && !allowedRoles.includes(role)) {
    console.log('AuthGuard - Role not allowed, redirecting');
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
  console.log('AuthGuard - Access granted');
  return true;
};


