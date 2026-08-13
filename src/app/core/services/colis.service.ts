import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { Colis, ColisRequest, HistoriqueColis, StatutColis, TranchePoids } from '../../shared/models/colis.model';

@Injectable({ providedIn: 'root' })
export class ColisService {
  private baseUrl = `${environment.baseUrl}/colis`;

  constructor(private http: HttpClient) {}

  getAll(agenceId?: string): Observable<Colis[]> {
    return this.http.get<Colis[]>(this.baseUrl, {
      params: agenceId ? { agenceId } : {}
    });
  }

  getById(id: string): Observable<Colis> {
    return this.http.get<Colis>(`${this.baseUrl}/${id}`);
  }

  getByNumeroSuivi(numeroSuivi: string): Observable<Colis> {
    return this.http.get<Colis>(`${this.baseUrl}/suivi/${numeroSuivi}`);
  }

  getByStatut(statut: StatutColis): Observable<Colis[]> {
    return this.http.get<Colis[]>(`${this.baseUrl}/statut/${statut}`);
  }

  getByTrajet(trajetId: string): Observable<Colis[]> {
    return this.http.get<Colis[]>(`${this.baseUrl}/trajet/${trajetId}`);
  }

  enregistrerColis(payload: ColisRequest): Observable<Colis> {
    return this.http.post<Colis>(this.baseUrl, payload);
  }

  confirmerPeseeAjusterPrix(colisId: string, poidsReel: number, trancheReelle: TranchePoids): Observable<Colis> {
    return this.http.put<Colis>(`${this.baseUrl}/${colisId}/pesee`, { poidsReel, trancheReelle });
  }

  chargerColisInTrajet(colisId: string, trajetId: string): Observable<Colis> {
    return this.http.put<Colis>(`${this.baseUrl}/${colisId}/charger`, null, { params: { trajetId } });
  }

  receptionnerColis(colisId: string): Observable<Colis> {
    return this.http.put<Colis>(`${this.baseUrl}/${colisId}/receptionner`, null);
  }

  demarrerLivraison(colisId: string, livreurId: string): Observable<Colis> {
    return this.http.put<Colis>(`${this.baseUrl}/${colisId}/demarrer-livraison`, null, { params: { livreurId } });
  }

  confirmerLivraison(colisId: string, codeOtp?: string): Observable<Colis> {
    return this.http.put<Colis>(`${this.baseUrl}/${colisId}/confirmer-livraison`, null, {
      params: codeOtp ? { codeOtp } : {}
    });
  }

  getHistorique(colisId: string): Observable<HistoriqueColis[]> {
    return this.http.get<HistoriqueColis[]>(`${this.baseUrl}/${colisId}/historique`);
  }

  annuler(colisId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${colisId}`);
  }
}
