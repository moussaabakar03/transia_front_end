export enum ModePaiement {
  ESPECES='ESPECES',
  TMONEY='TMONEY',
  FLOOZ='FLOOZ',
  CARTE_BANCAIRE='CARTE_BANCAIRE'
}

export interface PaiementPayload {
  reservationId: string;
  montantVerse: number;
  reference: string;
  modePaiement: ModePaiement;
}

export interface Paiement {
  id: string;
  reservationId: string;
  montantVerse: number;
  reference: string;
  modePaiement: ModePaiement;
}
