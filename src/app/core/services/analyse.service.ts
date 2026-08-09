import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AnalyseService {
  

private API_URL = environment.baseUrl;

constructor(private http: HttpClient) { }

getGlobalStats(): Observable<any> {
  return this.http.get(`${this.API_URL}/analysis/analysis/global_analysis/`);
}

getFormStats(formId: string): Observable<any> {
  return this.http.get(`${this.API_URL}/analysis/analysis/form_analysis/${formId}/`);
}

}
