import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isLoggedIn = authService.isLoggedIn();
  const userRole = authService.getRole(); // Contiendra 'ROLE_ADMIN' ou 'ROLE_AGENT_ACCUEIL'
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

  // VÉRIFICATION GLOBALE DES ACCÈS DU BACK-OFFICE
  if (isLoggedIn && path !== 'login') {
    const rolesAutorises = ['ROLE_ADMIN', 'ROLE_AGENT_ACCUEIL', 'ADMIN', 'AGENT_ACCUEIL'];
    
    if (!userRole || !rolesAutorises.includes(userRole)) {
      console.error(`Guard Bloquant : Le rôle ${userRole} n'est pas autorisé sur l'espace d'administration.`);
      authService.logout(); // Déconnexion forcée de la session non-autorisée
      router.navigate(['/login']);
      return false;
    }
  }

  // Droits restrictifs granulaires : Seul le rôle ROLE_ADMIN accède à la gestion des comptes
  if (path === 'gestion-comptes' && userRole !== 'ROLE_ADMIN' && userRole !== 'ADMIN') {
    router.navigate(['/tableau-de-bord']);
    return false;
  }

  return true;
};