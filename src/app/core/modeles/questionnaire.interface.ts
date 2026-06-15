/**
 * Cette interface définit la structure exacte d'un formulaire Valken's.
 * Elle sert de guide pour s'assurer que le Front (Angular) et le Back (Django) 
 * parlent le même langage.
 */
export interface Questionnaire {
  id?: string;               // Optionnel car généré par la base de données
  titre: string;             // Ex: "Enquête de terrain - Mai 2026"
  description?: string;
  dateCreation: Date;
  statut: 'brouillon' | 'deployé' | 'terminé';
  champs: ChampEnquete[];    // La liste des questions
}

export interface ChampEnquete {
  id: string;
  libelle: string;           // La question posée (ex: "Quel est votre secteur ?")
  type: 'texte' | 'nombre' | 'selection' | 'photo' | 'gps';
  obligatoire: boolean;
  options?: string[];        // Pour les menus déroulants
  valeurTemporaire?: any;    // Utilisé pour stocker la saisie de l'agent avant envoi
}