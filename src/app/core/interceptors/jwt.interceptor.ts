import { HttpInterceptorFn, HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (req.url.includes('/login') || req.url.includes('/token/refresh')) {
    return next(req);
  }

  const reqAvecToken = ajouterToken(req, authService.getToken());

  return next(reqAvecToken).pipe(
    catchError((error: HttpErrorResponse) => {

      // Seulement 401 déclenche le refresh — pas le 403
      // 403 = droits insuffisants (pas un token expiré)
      if (error.status === 401 && authService.getRefreshToken()) {
        return authService.rafraichirToken().pipe(
          switchMap(res => next(ajouterToken(req, res.access))),
          catchError(refreshError => {
            authService.logout();
            router.navigate(['/login']);
            return throwError(() => refreshError);
          })
        );
      }

      // 403 = on logue mais on NE déconnecte PAS
      if (error.status === 403) {
        console.warn(` Accès refusé (403) sur ${req.url} — droits insuffisants.`);
        // On retourne l'erreur sans déconnecter
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