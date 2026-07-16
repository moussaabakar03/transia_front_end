export enum StatutVehicule {
  DISPONIBLE = 'DISPONIBLE',
  EN_ROUTE = 'EN_ROUTE',
  EN_MAINTENANCE = 'EN_MAINTENANCE',
  HORS_SERVICE = 'HORS_SERVICE'
}

export interface Vehicule {
  id: string;
  marque: string;
  modele: string;
  immatriculation: string;
  capacite: number;
  capaciteSoute: number;
  statut: StatutVehicule;
  image: string;
  villeBaseId?: string;
  villeBaseNom?: string;
  villeActuelleId?: string;
  villeActuelleNom?: string;
}

export interface VehiculePayload {
  marque: string;
  modele: string;
  immatriculation: string;
  capacite: number;
  capaciteSoute: number;
  statut: StatutVehicule;
  image?: string | null;
  villeBaseId?: string | null;
  villeActuelleId?: string | null;
}
