import { Paiement } from "./paiement";
import { User } from "./users";

export enum StatutReservation {
  EN_ATTENTE = 'EN_ATTENTE',
  CONFIRMEE = 'CONFIRMEE',
  ANNULEE = 'ANNULEE',
  EXPIREE = 'EXPIREE'
}

export enum TypeReservation{
  EN_LIGNE, 
  PRESENTIEL
}


export interface Reservation {
  id?: string;
  dateReservation: string;
  statut: StatutReservation;
  nombrePlace: number;
  trajetId: string;
  billets?: Billet[];
  nomResponsable?: string;   
  user: User;
  paiement: Paiement;
  typeReservation: TypeReservation;
}


export interface Billet {
  id?: string;
  nomPassager: string;
  statut: string;
  qrCode?: string;
  numeroSiege?: string;
}