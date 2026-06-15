import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { ProfilUtilisateur, Utilisateur } from '../modeles/utilisateurs.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserService {
  private apiUrl = environment.baseUrl;
  private userSubject = new BehaviorSubject<Utilisateur | null>(null);
  user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Création utilisateur
  createUser(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/accounts/users/`, userData);
  }

  // Création profil
  createProfil(profilData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/accounts/profils/`, profilData);
  }

  // Profils par utilisateur
  getProfilsByUser(userId: string): Observable<ProfilUtilisateur[]> {
    return this.http.get<ProfilUtilisateur[]>(`${this.apiUrl}/accounts/profils/?user=${userId}`);
  }

  // Utilisateur courant (via /accounts/users/me/)
  fetchCurrentUser(): Observable<Utilisateur> {
    return this.http.get<Utilisateur>(`${this.apiUrl}/accounts/users/me/`);
  }

  // Profil courant (via /accounts/profils/my_profile/)
  getMyProfil(): Observable<ProfilUtilisateur> {
    return this.http.get<ProfilUtilisateur>(`${this.apiUrl}/accounts/profils/my_profile/`);
  }

  // Getter utilisateur
  getUser() {
    return this.userSubject.value;
  }

  // Enquêteurs actifs
  getEnqueteursActifs(): Observable<Utilisateur[]> {
    return this.http.get<Utilisateur[]>(`${this.apiUrl}/accounts/users/enqueteurs_actifs/`);
  }

  // Liste utilisateurs
  getUsers(): Observable<Utilisateur[]> {
    return this.http.get<Utilisateur[]>(`${this.apiUrl}/accounts/users/`);
  }

  // Liste profils
  getProfils(): Observable<ProfilUtilisateur[]> {
    return this.http.get<ProfilUtilisateur[]>(`${this.apiUrl}/accounts/profils/`);
  }

  // Suspendre compte
  suspendAccount(userId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/accounts/users/${userId}/suspend_account/`, {});
  }

  // Activer compte
  activateAccount(userId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/accounts/users/${userId}/activate_account/`, {});
  }

  // Mise à jour utilisateur
  updateUser(userId: string, userData: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/accounts/users/${userId}/`, userData);
  }

  // Mise à jour profil
  updateProfil(profilId: number, profilData: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/accounts/profils/${profilId}/`, profilData);
  }

  // Suppression utilisateur
  deleteUser(userId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/accounts/users/${userId}/`);
  }
}
