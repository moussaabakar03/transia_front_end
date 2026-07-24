import { UserResponse } from './users';

export enum TranchePoids {
  MOINS_DE_1KG = 'MOINS_DE_1KG',
  DE_1_A_5KG = 'DE_1_A_5KG',
  DE_5_A_10KG = 'DE_5_A_10KG',
  DE_10_A_20KG = 'DE_10_A_20KG',
  PLUS_DE_20KG = 'PLUS_DE_20KG'
}

export enum StatutColis {
  EN_ATTENTE_DEPOT = 'EN_ATTENTE_DEPOT',
  DEPOSE_EN_AGENCE = 'DEPOSE_EN_AGENCE',
  EN_TRANSIT = 'EN_TRANSIT',
  ARRIVE_EN_AGENCE = 'ARRIVE_EN_AGENCE',
  EN_COURS_LIVRAISON = 'EN_COURS_LIVRAISON',
  LIVRE = 'LIVRE',
  RETOURNE = 'RETOURNE',
  PERDU = 'PERDU',
  ANNULE = 'ANNULE'
}

export enum StatutPaiementColis {
  EN_ATTENTE = 'EN_ATTENTE',
  PARTIELLEMENT_PAYE = 'PARTIELLEMENT_PAYE',
  PAYE = 'PAYE'
}

export enum ModeRemise {
  LIVRAISON_DOMICILE = 'LIVRAISON_DOMICILE',
  RETRAIT_AGENCE = 'RETRAIT_AGENCE'
}

export interface HistoriqueColis {
  id?: string;
  colisId?: string;
  ancienStatut?: StatutColis;
  nouveauStatut: StatutColis;
  dateChangement: string;
  utilisateurId?: string;
  utilisateur?: UserResponse;
  commentaire?: string;
}

export interface Colis {
  id?: string;
  numeroSuivi?: string;
  description: string;
  tranchePoids: TranchePoids;
  poidsReel?: number;
  dimensions?: string;
  statut: StatutColis;
  statutPaiement: StatutPaiementColis;
  modeRemise: ModeRemise;
  expediteurNom: string;
  expediteurTelephone: string;
  destinataireNom: string;
  destinataireTelephone: string;
  destinataireAdresse?: string;
  prixEstime?: number;
  prixFinal?: number;
  fraisCollecte?: number;
  fraisLivraison?: number;
  dateCreation?: string;
  dateLivraison?: string;
  agenceDepartId?: string;
  agenceDepartNom?: string;
  agenceArriveeId?: string;
  agenceArriveeNom?: string;
  trajetId?: string;
  agentEnregistreurId?: string;
  agentEnregistreurNom?: string;
  livreurId?: string;
  livreurNom?: string;
  qrCode?: string;
  historique?: HistoriqueColis[];
}

export interface ColisRequest {
  description: string;
  tranchePoids: TranchePoids;
  dimensions?: string;
  modeRemise: ModeRemise;
  expediteurNom: string;
  expediteurTelephone: string;
  destinataireNom: string;
  destinataireTelephone: string;
  destinataireAdresse?: string;
  agenceDepartId: string;
  agenceArriveeId: string;
  collecteDomicile?: boolean;
}
