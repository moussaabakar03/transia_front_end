export enum StatutVehicule {
  Disponible = 'Disponible',
  En_Service = 'En_Service',
  En_maintenance = 'En_maintenance',
  Indisponible = 'Indisponible'
}

export interface Vehicule {
  id?: string;
  marque: string;
  modele: string;
  immatriculation: string;
  capacite: number;
  statut: StatutVehicule;
  image: string;
}


export interface VehiculePayload {
  marque: string;
  modele: string;
  immatriculation: string;
  capacite: number;
  statut: StatutVehicule;
  image?: string | null;
}


