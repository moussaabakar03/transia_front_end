import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProfilDTO, RoleDTO, StatutCompte, UserCreateDTO, UserUpdateDTO, UserResponse } from '../../shared/models/users';

@Injectable({ providedIn: 'root' })
export class UserService {
  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  // --- Rôles ---
  getAllRoles(): Observable<RoleDTO[]> {
    return this.http.get<RoleDTO[]>(`${this.baseUrl}/role`);
  }

  // --- Utilisateurs (gestion par SUPER_ADMIN / ADMIN_AGENCE) ---
  createUser(userData: UserCreateDTO): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.baseUrl}/users`, userData);
  }

  getUsers(): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(`${this.baseUrl}/users`);
  }

  getUserById(id: number): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.baseUrl}/users/${id}`);
  }

  // PUT /users/{publicId} (UUID)
  updateUser(publicId: string, userData: UserUpdateDTO): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${this.baseUrl}/users/${publicId}`, userData);
  }

  changerStatutCompte(publicId: string, statutCompte: StatutCompte): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${this.baseUrl}/users/${publicId}/statut`, { statutCompte });
  }

  suspendreCompte(publicId: string): Observable<UserResponse> {
    return this.changerStatutCompte(publicId, 'INACTIF');
  }

  activerCompte(publicId: string): Observable<UserResponse> {
    return this.changerStatutCompte(publicId, 'ACTIF');
  }

  bloquerCompte(publicId: string): Observable<UserResponse> {
    return this.changerStatutCompte(publicId, 'BLOQUE');
  }

  reinitialiserMotDePasse(publicId: string): Observable<{ status: boolean; message: string }> {
    return this.http.put<{ status: boolean; message: string }>(`${this.baseUrl}/users/${publicId}/reset-password`, {});
  }

  deleteUser(publicId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/users/${publicId}`);
  }

  getChauffeurs(villeId?: string): Observable<UserResponse[]> {
    const url = villeId ? `${this.baseUrl}/utilisateur/chauffeurs?villeId=${villeId}` : `${this.baseUrl}/utilisateur/chauffeurs`;
    return this.http.get<UserResponse[]>(url);
  }

  getLivreurs(): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(`${this.baseUrl}/utilisateur/livreurs`);
  }

  // --- Mes informations (self-service uniquement) ---
  getMe(): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.baseUrl}/me`);
  }

  updateMe(data: { fullName: string; telephone: string; email?: string }): Observable<any> {
    return this.http.put(`${this.baseUrl}/me`, data);
  }

  // --- Profil personnel (self-service uniquement) ---
  getMyProfil(): Observable<ProfilDTO> {
    return this.http.get<ProfilDTO>(`${this.baseUrl}/profil/me`);
  }

  createMyProfil(profilData: ProfilDTO): Observable<ProfilDTO> {
    return this.http.post<ProfilDTO>(`${this.baseUrl}/profil/me`, profilData);
  }

  updateMyProfil(profilData: ProfilDTO): Observable<ProfilDTO> {
    return this.http.put<ProfilDTO>(`${this.baseUrl}/profil/me`, profilData);
  }

  changeMyPassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/me/password`, { currentPassword, newPassword });
  }
}
