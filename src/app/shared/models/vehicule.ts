// public enum StatutVehicule {
// 	Disponible,
// 	En_Service,
// 	En_maintenance,
// 	Indisponible
// }

export enum StatutVehicule {
  Disponible,
  En_Service,
  En_maintenance,
  Indisponible
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


