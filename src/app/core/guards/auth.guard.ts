import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isLoggedIn = authService.isLoggedIn();
  const path = route.routeConfig?.path;

  // Si l'utilisateur est déjà connecté et tente d'aller sur /login
  if (isLoggedIn && path === 'login') {
    router.navigate(['/tableau-de-bord']);
    return false;
  }

  // Si non connecté et tente d'accéder à une route protégée
  if (!isLoggedIn && path !== 'login') {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  // VÉRIFICATION GLOBALE DES ACCÈS DU BACK-OFFICE : seuls SUPER_ADMIN, ADMIN_AGENCE, AGENT_ACCUEIL
  if (isLoggedIn && path !== 'login') {
    if (!authService.isBackOfficeUser()) {
      console.error(`Guard bloquant : rôles ${authService.getRoles()} non autorisés sur l'espace d'administration.`);
      authService.logout();
      router.navigate(['/login']);
      return false;
    }
  }

  // Droits restrictifs granulaires : ces routes sont réservées à SUPER_ADMIN et ADMIN_AGENCE
  // (correspond aux entrées de menu masquées à AGENT_ACCUEIL dans sidebar.html)
  const ROUTES_ADMIN = ['gestion-comptes', 'agences', 'feedbacks'];
  if (path && ROUTES_ADMIN.includes(path) && !authService.hasRole('SUPER_ADMIN') && !authService.hasRole('ADMIN_AGENCE')) {
    router.navigate(['/tableau-de-bord']);
    return false;
  }

  return true;
};
