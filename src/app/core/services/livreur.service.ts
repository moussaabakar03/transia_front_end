import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { UserResponse } from '../../shared/models/users';

@Injectable({ providedIn: 'root' })
export class LivreurService {
  private baseUrl = `${environment.baseUrl}/livreurs`;

  constructor(private http: HttpClient) {}

  getLivreursDisponibles(): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(`${this.baseUrl}/disponibles`);
  }
}
