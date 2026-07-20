import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Agence, AgencePayload } from '../../shared/models/agence.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AgenceService {

  private readonly url = `${environment.baseUrl}/agences`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Agence[]> {
    return this.http.get<Agence[]>(this.url);
  }

  getById(id: string): Observable<Agence> {
    return this.http.get<Agence>(`${this.url}/${id}`);
  }

  getByVille(villeId: string): Observable<Agence[]> {
    return this.http.get<Agence[]>(`${this.url}/ville/${villeId}`);
  }

  create(payload: AgencePayload): Observable<Agence> {
    return this.http.post<Agence>(this.url, payload);
  }

  update(id: string, payload: AgencePayload): Observable<Agence> {
    return this.http.put<Agence>(`${this.url}/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  updateStatut(id: string, statut: boolean): Observable<Agence> {
    return this.http.put<Agence>(`${this.url}/${id}/statut`, { statut });
  }
}
