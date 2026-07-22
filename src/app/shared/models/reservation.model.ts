import { Paiement } from "./paiement";
import { Trajet } from "./trajet";

export enum StatutReservation {
  EN_ATTENTE = 'EN_ATTENTE',
  CONFIRMEE = 'CONFIRMEE',
  ANNULEE = 'ANNULEE',
  EXPIREE = 'EXPIREE'
}

export enum TypeReservation {
  EN_LIGNE = 'EN_LIGNE',
  PRESENTIEL = 'PRESENTIEL'
}


export interface Reservation {
  id?: string;
  dateReservation: string;
  statut: StatutReservation;
  nombrePlace: number;
  trajetId: string;
  trajet?: Trajet;
  billets?: Billet[];
  nomResponsable?: string;
  userId?: string;
  paiement?: Paiement;
  typeReservation: TypeReservation;
}


export interface Billet {
  id?: string;
  nomPassager: string;
  statut: string;
  qrCode?: string;
  numeroSiege?: string;
}