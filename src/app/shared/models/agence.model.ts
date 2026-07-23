export interface Agence {
  id?: string;
  nom: string;
  villeId: string;
  villeNom?: string;
  adresse?: string;
  telephone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  statut?: boolean;
  photos?: string[];
}

export interface AgencePayload {
  nom: string;
  villeId: string;
  adresse?: string;
  telephone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  photos?: string[];
}
