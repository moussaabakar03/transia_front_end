import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

/** Rôles autorisés à accéder au back-office web, par ordre de priorité d'affichage */
const ROLES_BACK_OFFICE = ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN_AGENCE', 'ROLE_AGENT_ACCUEIL'];

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = environment.baseUrl;

  login(credentials: { telephone: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        const token = response?.token || response?.accessToken;
        if (!token) return;

        localStorage.setItem('transia_token', token);

        const roles: string[] = Array.isArray(response.roles) ? response.roles : [];
        const roleAffiche = ROLES_BACK_OFFICE.find(r => roles.includes(r)) || roles[0] || 'CLIENT';

        const userProfile = {
          id:        response.id        || '',
          publicId:  response.id        || '',
          telephone: response.telephone || credentials.telephone,
          fullName:  response.fullName  || '',
          roles,
          role:      roleAffiche,
          agenceId:  response.agenceId  || null,
          agenceNom: response.agenceNom || null,
          villeId:   response.villeId   || null,
          villeNom:  response.villeNom  || null,
        };

        localStorage.setItem('transia_user', JSON.stringify(userProfile));
        localStorage.setItem('userRole', roleAffiche);
        localStorage.setItem('userRoles', JSON.stringify(roles));
      })
    );
  }

  getCurrentUser(): any {
    const userJson = localStorage.getItem('transia_user');
    return userJson ? JSON.parse(userJson) : null;
  }

  /** Rôle "principal" (priorité back-office), pour l'affichage et les gardes simples */
  getRole(): string | null {
    return localStorage.getItem('userRole') || this.getCurrentUser()?.role || null;
  }

  /** Ensemble complet des rôles de l'utilisateur (un utilisateur peut en avoir plusieurs) */
  getRoles(): string[] {
    const raw = localStorage.getItem('userRoles');
    if (!raw) return [];
    try { return JSON.parse(raw); } catch { return []; }
  }

  hasRole(role: string): boolean {
    const target = role.toUpperCase();
    return this.getRoles().some(r => r.toUpperCase() === target || r.toUpperCase() === `ROLE_${target}`);
  }

  /** true si l'utilisateur possède au moins un rôle autorisé sur le back-office web */
  isBackOfficeUser(): boolean {
    return this.getRoles().some(r => ROLES_BACK_OFFICE.includes(r.toUpperCase()));
  }

  getToken(): string | null {
    return localStorage.getItem('transia_token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem('transia_token');
    localStorage.removeItem('transia_user');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userRoles');
  }
}
