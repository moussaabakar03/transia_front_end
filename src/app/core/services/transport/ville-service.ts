import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Ville } from '../../../shared/models/ville';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class VilleService {
  
  
  constructor(private http: HttpClient) { }
  
  getAllVilles(): Observable<Ville[]> {
    return this.http.get<Ville[]>(`${environment.baseUrl}/ville`);
  }
  
  getVilleById(id: string): Observable<Ville> {
    return this.http.get<Ville>(`${environment.baseUrl}/ville/${id}`);
  }

  
  createVille(ville: Ville): Observable<Ville> {
    return this.http.post<Ville>(`${environment.baseUrl}/ville`, ville);
  }

  
  updateVille(ville: Ville): Observable<Ville> {
    return this.http.put<Ville>(`${environment.baseUrl}/ville/${ville.id}`, ville);
  }
  
  deleteVille(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.baseUrl}/ville/${id}`);
  }
  

}
