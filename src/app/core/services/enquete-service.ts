import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs'; // 'of' permet de simuler une réponse
import { Questionnaire } from '../modeles/questionnaire.interface';

@Injectable({
  providedIn: 'root'
})
export class EnqueteService {

  // URL de base qui pointera vers le Django d'Ali plus tard
  private readonly API_URL = 'http://127.0.0.1:8000/api'; 

  constructor(private http: HttpClient) { }

  /**
   * MOCK (Simulation) : Cette méthode permet de travailler 
   * même si le backend d'Ali n'est pas encore prêt.
   */
  getQuestionnaireTest(): Observable<Questionnaire> {
    const simulationDonnees: Questionnaire = {
      titre: "Enquête de Terrain Valken's",
      dateCreation: new Date(),
      statut: 'brouillon',
      champs: [
        { id: '1', libelle: 'Nom de l\'enquêté', type: 'texte', obligatoire: true },
        { id: '2', libelle: 'Secteur géographique', type: 'selection', obligatoire: true, options: ['Lomé', 'Kara', 'Sokodé'] }
      ]
    };
    
    // On retourne les données comme si elles venaient d'internet
    return of(simulationDonnees);
  }

  /**
   * VRAIE MÉTHODE : À utiliser quand Ali aura fini ses Endpoints
   */
  envoyerAuBackend(donnees: any): Observable<any> {
    return this.http.post(`${this.API_URL}/soumission/`, donnees);
  }
}