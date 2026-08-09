import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Paiement, PaiementPayload } from '../../shared/models/paiement';

@Injectable({ providedIn: 'root' })
export class PaiementService {
  private base = `${environment.baseUrl}/paiements`;

  constructor(private http: HttpClient) {}

  payer(payload: PaiementPayload): Observable<string> {
    return this.http.post(`${this.base}/caisse`, payload, { responseType: 'text' });
  }

  getAll(): Observable<Paiement[]> {
    return this.http.get<Paiement[]>(`${this.base}/caisse`);
  }

  getById(id: string): Observable<Paiement> {
    return this.http.get<Paiement>(`${this.base}/caisse/${id}`);
  }

  update(id: string, payload: Partial<PaiementPayload>): Observable<Paiement> {
    return this.http.put<Paiement>(`${this.base}/caisse/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
