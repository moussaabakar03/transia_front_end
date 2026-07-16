import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { Colis, ColisRequest, HistoriqueColis, StatutColis } from '../../shared/models/colis.model';

@Injectable({ providedIn: 'root' })
export class ColisService {
  private baseUrl = `${environment.baseUrl}/colis`;

  constructor(private http: HttpClient) {}

  getAll(filters?: {
    statut?: StatutColis;
    livreurId?: string;
    expediteurId?: string;
    search?: string;
  }): Observable<Colis[]> {
    return this.http.get<Colis[]>(this.baseUrl, { params: filters as any });
  }

  getById(id: string): Observable<Colis> {
    return this.http.get<Colis>(`${this.baseUrl}/${id}`);
  }

  getByNumeroSuivi(numeroSuivi: string): Observable<Colis> {
    return this.http.get<Colis>(`${this.baseUrl}/suivi/${numeroSuivi}`);
  }

  create(payload: ColisRequest): Observable<Colis> {
    return this.http.post<Colis>(this.baseUrl, payload);
  }

  createDemandeEnlevement(payload: ColisRequest): Observable<Colis> {
    return this.http.post<Colis>(`${this.baseUrl}/demande-enlevement`, payload);
  }

  updatePartial(id: string, payload: Partial<ColisRequest>): Observable<Colis> {
    return this.http.patch<Colis>(`${this.baseUrl}/${id}`, payload);
  }

  assignerLivreur(colisId: string, livreurId: string): Observable<Colis> {
    return this.http.post<Colis>(`${this.baseUrl}/${colisId}/assigner-livreur`, null, {
      params: { livreurId }
    });
  }

  collecter(colisId: string, commentaire?: string): Observable<Colis> {
    return this.http.post<Colis>(`${this.baseUrl}/${colisId}/collecter`, null, {
      params: { commentaire: commentaire || '' }
    });
  }

  livrer(colisId: string, commentaire?: string): Observable<Colis> {
    return this.http.post<Colis>(`${this.baseUrl}/${colisId}/livrer`, null, {
      params: { commentaire: commentaire || '' }
    });
  }

  getHistorique(colisId: string): Observable<HistoriqueColis[]> {
    return this.http.get<HistoriqueColis[]>(`${this.baseUrl}/${colisId}/historique`);
  }

  annuler(colisId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${colisId}`);
  }

  findNearby(latitude: number, longitude: number, distanceKm?: number): Observable<Colis[]> {
    return this.http.get<Colis[]>(`${this.baseUrl}/proximity/nearby`, {
      params: {
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        distanceKm: (distanceKm || 10).toString()
      }
    });
  }
}
