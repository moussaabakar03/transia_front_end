export enum StatutCollecte {
  EN_ATTENTE = 'EN_ATTENTE',
  EN_COURS = 'EN_COURS',
  COLLECTE = 'COLLECTE',
  ANNULE = 'ANNULE'
}

export interface DemandeCollecte {
  id?: string;
  adresseCollecte: string;
  latitude?: number;
  longitude?: number;
  dateHeureCollecte: string;
  statut: StatutCollecte;
  expediteurId?: string;
  expediteurNom?: string;
  agenceId?: string;
  agenceNom?: string;
  livreurId?: string;
  livreurNom?: string;
  colisId?: string;
  colisNumeroSuivi?: string;
  tourneeId?: string;
}

export interface DemandeCollecteRequest {
  adresseCollecte: string;
  latitude?: number;
  longitude?: number;
  dateHeureCollecte: string;
  agenceId: string;
}
