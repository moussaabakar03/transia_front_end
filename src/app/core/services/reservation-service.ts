import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Reservation } from '../../shared/models/reservation.model';

@Injectable({ providedIn: 'root' })
export class ReservationService {
  
  private baseUrl = `${environment.baseUrl}/reservations`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(this.baseUrl);
  }

  getById(id: string): Observable<Reservation> {
    return this.http.get<Reservation>(`${this.baseUrl}/${id}`);
  }

  create(payload: any): Observable<Reservation> {
    return this.http.post<Reservation>(this.baseUrl, payload);
  }

  update(id: string, payload: any): Observable<Reservation> {
    return this.http.put<Reservation>(`${this.baseUrl}/${id}`, payload);
  }

  annuler(id: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/${id}/annuler`, {});
  }

  getPlacesTrajet(trajetId: string): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/trajet/${trajetId}`);
  }

  getByTrajet(trajetId: string): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.baseUrl}/trajet/${trajetId}/liste`);
  }

  getOccupiedSeats(trajetId: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/trajet/${trajetId}/sieges-occupes`);
  }
  
}