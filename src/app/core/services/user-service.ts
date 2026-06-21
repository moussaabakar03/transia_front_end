import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, switchMap, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ProfilComplet, ProfilDTO, RoleDTO, UserCreateDTO, UserUpdateDTO, UserResponse } from '../../shared/models/users';

@Injectable({ providedIn: 'root' })
export class UserService {
  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  // --- Rôles ---
  getAllRoles(): Observable<RoleDTO[]> {
    return this.http.get<RoleDTO[]>(`${this.baseUrl}/role`);
  }

  // --- Utilisateurs ---
  createUser(userData: UserCreateDTO): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.baseUrl}/users`, userData);
  }

  getUsers(): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(`${this.baseUrl}/users`);
  }

  getUserById(id: number): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.baseUrl}/users/${id}`);
  }

  // PUT /users/{publicId} (UUID, pas l'id numérique)
  updateUser(publicId: string, userData: UserUpdateDTO): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${this.baseUrl}/users/${publicId}`, userData);
  }

  suspendAccount(publicId: string, current: UserUpdateDTO): Observable<any> {
    return this.updateUser(publicId, { ...current, enable: false });
  }

  activateAccount(publicId: string, current: UserUpdateDTO): Observable<any> {
    return this.updateUser(publicId, { ...current, enable: true });
  }

  deleteUser(publicId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/users/${publicId}`);
  }

  getChauffeurs(): Observable<any[]> {4
    return this.http.get<any[]>(`${this.baseUrl}/utilisateur/chauffeurs`);
  }


  // --- Profils ---
  getProfilByUserId(userId: number): Observable<ProfilDTO> {
    return this.http.get<ProfilDTO>(`${this.baseUrl}/profil/${userId}`);
  }

  createProfil(profilData: ProfilDTO): Observable<ProfilDTO> {
    return this.http.post<ProfilDTO>(`${this.baseUrl}/profil`, profilData);
  }

  updateProfil(userId: number, profilData: ProfilDTO): Observable<ProfilDTO> {
    return this.http.put<ProfilDTO>(`${this.baseUrl}/profil/${userId}`, profilData);
  }

  // --- Combinaison user + profil (remplace l'appel à /profils inexistant) ---
  getProfilsComplets(): Observable<ProfilComplet[]> {
    return this.getUsers().pipe(
      switchMap(users => {
        if (users.length === 0) return of([]);
        const requetes = users.map(user =>
          this.getProfilByUserId(user.id).pipe(
            catchError(() => of(null))
          )
        );
        return forkJoin(requetes).pipe(
          map(profils => users.map((user, i) => {
            const p = profils[i];
            return {
              userId: user.id,
              photoProfil: p?.photoProfil ?? null,
              telephone: p?.telephone ?? '',
              nomComplet: p?.nomComplet ?? user.fullName,
              adresse: p?.adresse ?? '',
              user: user
            } as ProfilComplet;
          }))
        );
      })
    );
  }
}