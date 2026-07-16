import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Vehicule, VehiculePayload } from '../../../shared/models/vehicule';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class VehiculeService {

  constructor(private http: HttpClient) {}

  getAll(): Observable<Vehicule[]> {
    return this.http.get<Vehicule[]>(`${environment.baseUrl}/vehicule`);
  }

  create(payload: VehiculePayload): Observable<Vehicule> {
    return this.http.post<Vehicule>(`${environment.baseUrl}/vehicule`, payload);
  }

  update(id: string, payload: VehiculePayload): Observable<Vehicule> {
    return this.http.put<Vehicule>(`${environment.baseUrl}/vehicule/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.baseUrl}/vehicule/${id}`);
  }

  getById(id: string): Observable<Vehicule> {
    return this.http.get<Vehicule>(`${environment.baseUrl}/vehicule/${id}`);
  }

  getDisponibles(): Observable<Vehicule[]> {
    return this.http.get<Vehicule[]>(`${environment.baseUrl}/vehicule/disponible`);
  }

  getDisponiblesByVille(villeId: string): Observable<Vehicule[]> {
    return this.http.get<Vehicule[]>(`${environment.baseUrl}/vehicule/disponible?villeId=${villeId}`);
  }
}
