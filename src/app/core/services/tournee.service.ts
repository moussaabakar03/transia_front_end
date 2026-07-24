import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { Tournee, TourneeRequest } from '../../shared/models/tournee.model';

@Injectable({ providedIn: 'root' })
export class TourneeService {
  private baseUrl = `${environment.baseUrl}/tournees`;

  constructor(private http: HttpClient) {}

  getAll(filters?: {
    date?: string;
    livreurId?: string;
    zone?: string;
  }): Observable<Tournee[]> {
    return this.http.get<Tournee[]>(this.baseUrl, { params: filters as any });
  }

  getById(id: string): Observable<Tournee> {
    return this.http.get<Tournee>(`${this.baseUrl}/${id}`);
  }

  create(payload: TourneeRequest): Observable<Tournee> {
    return this.http.post<Tournee>(this.baseUrl, payload);
  }

  updatePartial(id: string, payload: Partial<TourneeRequest>): Observable<Tournee> {
    return this.http.patch<Tournee>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  addDemandeToTournee(tourneeId: string, demandeId: string): Observable<Tournee> {
    return this.http.post<Tournee>(`${this.baseUrl}/${tourneeId}/demandes/${demandeId}`, null);
  }

  removeDemandeFromTournee(tourneeId: string, demandeId: string): Observable<Tournee> {
    return this.http.delete<Tournee>(`${this.baseUrl}/${tourneeId}/demandes/${demandeId}`);
  }
}
