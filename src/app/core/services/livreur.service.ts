import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { UserResponse } from '../../shared/models/users';

@Injectable({ providedIn: 'root' })
export class LivreurService {
  private baseUrl = `${environment.baseUrl}/utilisateur`;

  constructor(private http: HttpClient) {}

  getLivreurs(): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(`${this.baseUrl}/livreurs`);
  }

  getLivreursDisponibles(): Observable<UserResponse[]> {
    return this.getLivreurs();
  }
}
