import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';

export interface FormLogo {
  id: string;
  image: string;
  ordre: number;
  uploaded_at: string;
}

export interface FormCustomisation {
  id?: string;
  customized_form?: string;
  logo?: string | null;
  primary_color?: string;
  secondary_color?: string;
  header_title?: string;
  header_subtitle?: string;
  footer_text?: string;
  banner_image?: string | null;
  logos?: FormLogo[];
}

@Injectable({ providedIn: 'root' })
export class CustomisationService {
  private baseUrl = environment.baseUrl;

  private jsonHeaders = new HttpHeaders({
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  });

  constructor(private http: HttpClient) {}

  getParFormulaire(formId: string): Observable<FormCustomisation[]> {
    return this.http.get<FormCustomisation[]>(
      `${this.baseUrl}/customization/form-customization/?form=${formId}`
    );
  }

  creer(data: FormCustomisation): Observable<FormCustomisation> {
    console.log('📤 [CustomisationService] Payload envoyé :', data);
    return this.http.post<FormCustomisation>(
      `${this.baseUrl}/customization/form-customization/`,
      data,
      { headers: this.jsonHeaders }
    );
  }

  mettreAJour(id: string, data: Partial<FormCustomisation>): Observable<FormCustomisation> {
    return this.http.patch<FormCustomisation>(
      `${this.baseUrl}/customization/form-customization/${id}/`,
      data,
      { headers: this.jsonHeaders }
    );
  }

  // ✅ Upload logo principal
  uploadLogo(id: string, fichier: File): Observable<FormCustomisation> {
    const formData = new FormData();
    formData.append('logo', fichier);
    return this.http.patch<FormCustomisation>(
      `${this.baseUrl}/customization/form-customization/${id}/upload_logo/`,
      formData
    );
  }

  // ✅ Upload bannière
  uploadBanniere(id: string, fichier: File): Observable<FormCustomisation> {
    const formData = new FormData();
    formData.append('banner_image', fichier);
    return this.http.patch<FormCustomisation>(
      `${this.baseUrl}/customization/form-customization/${id}/upload_banner/`,
      formData
    );
  }

  // ✅ Ajouter un logo supplémentaire
  ajouterLogo(id: string, fichier: File): Observable<FormLogo> {
    const formData = new FormData();
    formData.append('image', fichier);
    return this.http.post<FormLogo>(
      `${this.baseUrl}/customization/form-customization/${id}/ajouter_logo/`,
      formData
    );
  }

  // ✅ Supprimer un logo supplémentaire
  supprimerLogo(customisationId: string, logoId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/customization/form-customization/${customisationId}/supprimer_logo/${logoId}/`
    );
  }

  supprimer(id: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/customization/form-customization/${id}/`
    );
  }
}