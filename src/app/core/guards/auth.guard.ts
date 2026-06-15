import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isLoggedIn = authService.isLoggedIn();
  const userRole = authService.getRole(); // Contiendra 'ROLE_ADMIN'
  const path = route.routeConfig?.path;

  // Si l'utilisateur est déjà connecté et tente d'aller sur /login -> Redirection Dashboard
  if (isLoggedIn && path === 'login') {
    router.navigate(['/tableau-de-bord']); // 💥 CHANGER ICI (au lieu de /villes)
    return false;
  }

  // Si non connecté et tente d'accéder à une route protégée
  if (!isLoggedIn && path !== 'login') {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  // Droits restrictifs : Seul le rôle ROLE_ADMIN accède à la gestion des comptes
  if (path === 'gestion-comptes' && userRole !== 'ROLE_ADMIN') {
    router.navigate(['/tableau-de-bord']); // 💥 CHANGER ICI (au lieu de /villes)
    return false;
  }

  return true;
};