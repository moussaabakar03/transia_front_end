import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DemandeCollecte, DemandeCollecteRequest } from '../../shared/models/demande-collecte.model';

@Injectable({ providedIn: 'root' })
export class DemandeCollecteService {
  private baseUrl = `${environment.baseUrl}/colis/collecte`;

  constructor(private http: HttpClient) {}

  getAll(agenceId?: string): Observable<DemandeCollecte[]> {
    return this.http.get<DemandeCollecte[]>(this.baseUrl, {
      params: agenceId ? { agenceId } : {}
    });
  }

  create(payload: DemandeCollecteRequest): Observable<DemandeCollecte> {
    return this.http.post<DemandeCollecte>(this.baseUrl, payload);
  }

  assignerLivreur(id: string, livreurId: string): Observable<DemandeCollecte> {
    return this.http.put<DemandeCollecte>(`${this.baseUrl}/${id}/assigner`, null, { params: { livreurId } });
  }

  collecter(id: string, colisId: string): Observable<DemandeCollecte> {
    return this.http.put<DemandeCollecte>(`${this.baseUrl}/${id}/collecter`, null, { params: { colisId } });
  }

  annuler(id: string): Observable<DemandeCollecte> {
    return this.http.put<DemandeCollecte>(`${this.baseUrl}/${id}/annuler`, null);
  }
}
