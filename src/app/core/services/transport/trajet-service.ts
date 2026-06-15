import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Trajet } from '../../../shared/models/trajet';
import { environment } from '../../../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class TrajetService {
  
  constructor(private http: HttpClient) {}

  getAll(): Observable<Trajet[]> {
    return this.http.get<Trajet[]>(`${environment.baseUrl}/trajet`);
  }

  getTrajetById(id: string): Observable<Trajet> {
    return this.http.get<Trajet>(`${environment.baseUrl}/trajet/${id}`);
  }

  create(payload: any): Observable<Trajet> {
    return this.http.post<Trajet>(`${environment.baseUrl}/trajet`, payload);
  }

  update(id: string, payload: any): Observable<Trajet> {
    return this.http.put<Trajet>(`${environment.baseUrl}/trajet/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.baseUrl}/trajet/${id}`);
  }
}
