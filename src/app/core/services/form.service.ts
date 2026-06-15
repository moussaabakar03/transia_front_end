import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, forkJoin, } from 'rxjs';
import { map } from 'rxjs/operators';
import { Formulaire, Field } from '../modeles/forms.model';
import { environment } from '../../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class FormService {
  private baseUrl = environment.baseUrl;

  private jsonHeaders = new HttpHeaders({
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  });

  constructor(private http: HttpClient) {}

  // ── Dashboard Stats ──────────────────────────────────────────────────────
  // Construit les stats dynamiquement depuis les vrais endpoints
  getDashboardStats(): Observable<any> {
    return forkJoin({
      forms: this.getRecentForms(),
      users: this.getEnqueteursActifs()
    }).pipe(
      map(({ forms, users }) => {
        const deployes = forms.filter(f => {
          const s = (f.status ?? '').toLowerCase();
          return s === 'deploye' || s === 'deployed';
        });
        return {
          total_soumissions: 0,          // branché dans SubmissionService
          enqueteurs_actifs: users.length,
          formulaires_en_cours: deployes.length
        };
      })
    );
  }

  // ── Formulaires ──────────────────────────────────────────────────────────

  getRecentForms(): Observable<Formulaire[]> {
    return this.http.get<Formulaire[]>(`${this.baseUrl}/forms/forms/`);
  }

  getFormById(id: string): Observable<Formulaire> {
    return this.http.get<Formulaire>(`${this.baseUrl}/forms/forms/${id}/`);
  }

  getArchivedForms(): Observable<Formulaire[]> {
    return this.http.get<Formulaire[]>(`${this.baseUrl}/forms/forms/archived/`);
  }

  getDeployedForms(): Observable<Formulaire[]> {
    return this.http.get<Formulaire[]>(`${this.baseUrl}/forms/forms/deployed/`);
  }

  getDraftForms(): Observable<Formulaire[]> {
    return this.http.get<Formulaire[]>(`${this.baseUrl}/forms/forms/drafts/`);
  }

  createForm(formulaire: any): Observable<Formulaire> {
    return this.http.post<Formulaire>(
      `${this.baseUrl}/forms/forms/`,
      formulaire,
      { headers: this.jsonHeaders }
    );
  }

  updateForm(id: string, formulaire: Partial<Formulaire>): Observable<Formulaire> {
    return this.http.patch<Formulaire>(
      `${this.baseUrl}/forms/forms/${id}/`,
      formulaire,
      { headers: this.jsonHeaders }
    );
  }

  deleteForm(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/forms/forms/${id}/`);
  }

  duplicateForm(id: string): Observable<Formulaire> {
    return this.http.post<Formulaire>(
      `${this.baseUrl}/forms/forms/${id}/duplicate/`,
      {},
      { headers: this.jsonHeaders }
    );
  }

  restoreArchivedForm(id: string): Observable<Formulaire> {
    return this.updateForm(id, { status: 'brouillon' });
  }

  deployForm(id: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/forms/forms/${id}/deploy/`, {});
  }

  archive(id: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/forms/forms/${id}/archive/`, {});
  }

  // ── Champs / Questions ───────────────────────────────────────────────────

  // ✅ Filtre les champs par formulaire — utilisé par FormBuilder
  getFieldsByForm(formId: string): Observable<Field[]> {
    return this.http.get<Field[]>(`${this.baseUrl}/forms/fields/?form=${formId}`);
  }

  createField(field: Field): Observable<Field> {
    return this.http.post<Field>(
      `${this.baseUrl}/forms/fields/`,
      field,
      { headers: this.jsonHeaders }
    );
  }

  updateField(id: string, field: Partial<Field>): Observable<Field> {
    return this.http.patch<Field>(
      `${this.baseUrl}/forms/fields/${id}/`,
      field,
      { headers: this.jsonHeaders }
    );
  }

  deleteField(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/forms/fields/${id}/`);
  }

  // ── Utilisateurs ─────────────────────────────────────────────────────────

  // GET /v1/accounts/users/enqueteurs_actifs/
  getEnqueteursActifs(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/accounts/users/enqueteurs_actifs/`);
  }


  getFormStatistics(formId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/forms/forms/${formId}/statistics/`);
  }

  downloadTemplateExcel(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/forms/forms/download-template/`, {
      responseType: 'blob'
    });
  }

  importFormulaireExcel(file: File, title: string, description: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('form_title', title);
    formData.append('form_description', description);

    // Pas de jsonHeaders ici, HttpClient s'occupe du multipart/form-data automatiquement
    return this.http.post<any>(`${this.baseUrl}/forms/forms/import-excel/`, formData);
  }

}