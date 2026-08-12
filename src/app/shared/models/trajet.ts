import { Agence } from './agence.model';
import { Vehicule } from './vehicule';
import { Ville } from './ville';

export enum StatutTrajet {
  PROGRAMME = 'PROGRAMME',
  EN_COURS = 'EN_COURS',
  TERMINE = 'TERMINE',
  ANNULE = 'ANNULE',
  EXPIRE = 'EXPIRE'
}

export interface Trajet {
  id?: string;
  villeDepart: Ville;
  villeArrivee: Ville;
  vehicule: Vehicule;
  distance: number;
  dureeEstimee: string;
  tarif: number;
  dateDepart: string;
  heureDepart: string;
  statut: StatutTrajet;
  chauffeurId?: string;   // publicId (UUID) du chauffeur
  chauffeurNom?: string;
  agenceId?: string;
  agenceNom?: string;
  agenceDepartId?: string;
  agenceDepartNom?: string;
  agenceDepartAdresse?: string;
  agenceDepart?: Agence;
  agenceArriveeId?: string;
  agenceArriveeNom?: string;
  agenceArriveeAdresse?: string;
  agenceArrivee?: Agence;
}
