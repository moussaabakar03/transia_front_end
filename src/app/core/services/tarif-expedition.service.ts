import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EstimationPrix, TarifExpedition, TarifExpeditionRequest } from '../../shared/models/tarif-expedition.model';
import { ModeRemise, TranchePoids } from '../../shared/models/colis.model';

@Injectable({ providedIn: 'root' })
export class TarifExpeditionService {
  private baseUrl = `${environment.baseUrl}/colis/tarifs`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<TarifExpedition[]> {
    return this.http.get<TarifExpedition[]>(this.baseUrl);
  }

  getByVilles(departId: string, arriveeId: string): Observable<TarifExpedition[]> {
    return this.http.get<TarifExpedition[]>(`${this.baseUrl}/villes`, {
      params: { departId, arriveeId }
    });
  }

  estimer(
    departId: string,
    arriveeId: string,
    tranche: TranchePoids,
    modeRemise: ModeRemise,
    collecteDomicile = false
  ): Observable<EstimationPrix> {
    return this.http.get<EstimationPrix>(`${this.baseUrl}/estimer`, {
      params: { departId, arriveeId, tranche, modeRemise, collecteDomicile: String(collecteDomicile) }
    });
  }

  create(payload: TarifExpeditionRequest): Observable<TarifExpedition> {
    return this.http.post<TarifExpedition>(this.baseUrl, payload);
  }

  update(id: string, payload: TarifExpeditionRequest): Observable<TarifExpedition> {
    return this.http.put<TarifExpedition>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
