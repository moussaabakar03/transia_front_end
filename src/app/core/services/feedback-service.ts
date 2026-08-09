import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Feedback } from '../../shared/models/Feedback';

@Injectable({ providedIn: 'root' })
export class FeedbackService {
  private baseUrl = `${environment.baseUrl}/feedback`;

  constructor(private http: HttpClient) {}

  getAllFeedbacks(): Observable<Feedback[]> {
    return this.http.get<Feedback[]>(`${this.baseUrl}/all`);
  }

  getById(id: string): Observable<Feedback> {
    return this.http.get<Feedback>(`${this.baseUrl}/${id}`);
  }

  create(payload: Feedback): Observable<Feedback> {
    return this.http.post<Feedback>(this.baseUrl, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
