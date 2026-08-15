import { HttpInterceptorFn, HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

// Routes publiques exactes (pas de sous-chaîne : "/api/v1/users/{id}/reset-password" ne doit PAS matcher "/reset-password")
const ROUTES_PUBLIQUES = [
  `${environment.baseUrl}/login`,
  `${environment.baseUrl}/register`,
  `${environment.baseUrl}/forgot-password`,
  `${environment.baseUrl}/reset-password`,
];

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const urlSansQuery = req.url.split('?')[0];
  const isSuiviPublic = urlSansQuery.includes('/colis/suivi/');

  if (ROUTES_PUBLIQUES.includes(urlSansQuery) || isSuiviPublic) {
    return next(req);
  }

  const reqAvecToken = ajouterToken(req, authService.getToken());

  return next(reqAvecToken).pipe(
    catchError((error: HttpErrorResponse) => {

      // 401 = token absent/expiré/invalide — pas de flux de refresh côté backend, on déconnecte sauf sur page publique
      if (error.status === 401 && !isSuiviPublic) {
        authService.logout();
        router.navigate(['/login']);
        return throwError(() => error);
      }

      // 403 = droits insuffisants (pas un problème de token) — on logue mais on NE déconnecte PAS
      if (error.status === 403) {
        console.warn(`Accès refusé (403) sur ${req.url} — droits insuffisants.`);
        return throwError(() => error);
      }

      return throwError(() => error);
    })
  );
};

function ajouterToken(req: HttpRequest<any>, token: string | null): HttpRequest<any> {
  if (!token) return req;
  return req.clone({
    setHeaders: { Authorization: `Bearer ${token}` }
  });
}
