import { Vehicule } from './vehicule';
import { Ville } from './ville';

export enum StatutTrajet {
  PROGRAMME,
  EN_COURS,
  TERMINE,
  ANNULE
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
  chauffeurId?: number;   // seul l'ID remonte du backend
}





// import { User } from './users';
// import { Vehicule } from './vehicule';
// import { Ville } from './ville';

// export interface TrajetForm {
//   villeDepartId: string;
//   villeArriveeId: string;
//   vehiculeId: string;
//   distance: number | null;
//   dureeEstimee: string;
//   tarif: number | null;
//   dateDepart: string;
//   heureDepart: string;
//   statut: string;
//   chauffeurPublicId: string;
// }

// export enum StatutTrajet {
//   PROGRAMME,
//   EN_COURS,
//   TERMINE,
//   ANNULE
// }

// export interface Trajet {
//   id?: string;
//   villeDepart: Ville;
//   villeArrivee: Ville;
//   vehicule: Vehicule;
//   distance: number;
//   dureeEstimee: string;
//   tarif: number;
//   dateDepart: string;
//   heureDepart: string;
//   statut: StatutTrajet;
//   chauffeur: User;
// }



