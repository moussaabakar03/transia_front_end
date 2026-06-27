import { UserResponse } from './users';

export enum StatutColis {
  EN_ATTENTE_COLLECTE = 'EN_ATTENTE_COLLECTE',
  PRIS_EN_CHARGE = 'PRIS_EN_CHARGE',
  COLLECTE_EFFECTUEE = 'COLLECTE_EFFECTUEE',
  EN_COURS = 'EN_COURS',
  LIVRE = 'LIVRE',
  ANNULE = 'ANNULE'
}

export enum ModeDepot {
  ENLEVEMENT_DOMICILE = 'ENLEVEMENT_DOMICILE',
  DEPOT_AGENCE = 'DEPOT_AGENCE',
  CREATION_AGENCE = 'CREATION_AGENCE'
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
  expediteurId?: string;
  expediteur?: UserResponse;
  nomDestinataire: string;
  adresseDestinataire: string;
  telephoneDestinataire: string;
  poids: number;
  longueur: number;
  largeur: number;
  hauteur: number;
  statut: StatutColis;
  livreurId?: string;
  livreur?: UserResponse;
  remarques?: string;
  dateCreation?: string;
  dateLivraison?: string;
  modeDepot: ModeDepot;
  adresseCollecte?: string;
  telephoneCollecte?: string;
  dateHeureCollecteSouhaitee?: string;
  latitudeDestinataire?: number;
  longitudeDestinataire?: number;
  latitudeCollecte?: number;
  longitudeCollecte?: number;
  historique?: HistoriqueColis[];
  tourneeId?: string;
  villeDepartId?: string;
  villeDepartNom?: string;
  villeArriveeId?: string;
  villeArriveeNom?: string;
  trajetId?: string;
  modeRemise?: ModeRemise;
  qrCode?: string;
}

export interface ColisRequest {
  expediteurId?: string;
  nomDestinataire: string;
  adresseDestinataire: string;
  telephoneDestinataire: string;
  poids: number;
  longueur: number;
  largeur: number;
  hauteur: number;
  remarques?: string;
  modeDepot: ModeDepot;
  adresseCollecte?: string;
  telephoneCollecte?: string;
  dateHeureCollecteSouhaitee?: string;
  latitudeDestinataire?: number;
  longitudeDestinataire?: number;
  latitudeCollecte?: number;
  longitudeCollecte?: number;
  villeDepartId?: string;
  villeArriveeId?: string;
  trajetId?: string;
  modeRemise?: ModeRemise;
}
