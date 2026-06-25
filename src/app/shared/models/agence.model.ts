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
}

export interface AgencePayload {
  nom: string;
  villeId: string;
  adresse?: string;
  telephone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
}
