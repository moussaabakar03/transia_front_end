export enum ModePaiement {
  ESPECES='ESPECES',
  TMONEY='TMONEY',
  FLOOZ='FLOOZ',
  CARTE_BANCAIRE='CARTE_BANCAIRE'
}

export interface PaiementPayload {
  reservationId: { id: string };   
  montantVerse: number;
  reference: string;
  modePaiement: ModePaiement;
}

export interface Paiement {
  id: string;
  reservationId: { id: string; nomResponsable?: string };
  montantVerse: number;
  reference: string;
  modePaiement: ModePaiement;
}
