import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class SubmissionService {
  private baseUrl = environment.baseUrl;

  private jsonHeaders = new HttpHeaders({
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  });

  constructor(private http: HttpClient) {}

  // GET /v1/submissions/submissions/
  getAllSubmissions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/submissions/submissions/`);
  }

  // GET /v1/submissions/submissions/my_submissions/
  getMesSubmissions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/submissions/submissions/my_submissions/`);
  }

  // GET /v1/submissions/submissions/{id}/
  getSubmissionById(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/submissions/submissions/${id}/`);
  }

  // GET /v1/submissions/submissions/?form=<id>
  getSubmissionsByForm(formId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/submissions/submissions/?form=${formId}`);
  }

  // POST /v1/submissions/submissions/{id}/submit/
  soumettre(id: string, data: any): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/submissions/submissions/${id}/submit/`,
      data,
      { headers: this.jsonHeaders }
    );
  }

  // ✅ NOUVELLE MÉTHODE : GET /v1/submissions/submissions/{formId}/export-excel/
  downloadExcel(formId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/submissions/submissions/${formId}/export-excel/`, {
      responseType: 'blob'
    });
  }
}