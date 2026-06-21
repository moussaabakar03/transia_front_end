import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = environment.baseUrl

  login(credentials: { username: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        // CHANGER ICI : Ton serveur renvoie 'accessToken' (ou 'token'), pas 'access'
        const token = response?.accessToken || response?.token;
        
        if (token) {
          localStorage.setItem('transia_token', token);
          // Si ton serveur ne renvoie pas de refresh token spécifique, on stocke le jeton par défaut
          localStorage.setItem('transia_refresh', response.refresh || token);
          
          // CHANGER ICI : Extraction du rôle depuis le tableau 'roles'
          const roleName = (response.roles && response.roles.length > 0) 
            ? response.roles[0] 
            : 'CLIENT';
          
          const userProfile = {
            id: response.id || '',
            username: response.username || credentials.username,
            nom: response.fullName || '',
            prenom: '',
            role: roleName
          };
          
          localStorage.setItem('transia_user', JSON.stringify(userProfile));
          localStorage.setItem('userRole', roleName);
        }
      })
    );
  }


  rafraichirToken(): Observable<any> {
    const refresh = localStorage.getItem('transia_refresh');
    if (!refresh) return throwError(() => new Error('Pas de refresh token'));

    return this.http.post<any>(`${this.apiUrl}/token/refresh/`, { refresh }).pipe(
      tap(response => {
        if (response?.access) {
          localStorage.setItem('transia_token', response.access);
        }
      }),
      catchError(err => {
        this.logout();
        return throwError(() => err);
      })
    );
  }

  getCurrentUser(): any {
    const userJson = localStorage.getItem('transia_user');
    return userJson ? JSON.parse(userJson) : null;
  }

  getRole(): string | null {
    return localStorage.getItem('userRole') || this.getCurrentUser()?.role || null;
  }

  getToken(): string | null {
    return localStorage.getItem('transia_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('transia_refresh');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem('transia_token');
    localStorage.removeItem('transia_refresh');
    localStorage.removeItem('transia_user');
    localStorage.removeItem('userRole');
  }
}


