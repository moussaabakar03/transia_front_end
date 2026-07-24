import { TranchePoids } from './colis.model';

export interface TarifExpedition {
  id?: string;
  villeDepartId: string;
  villeDepartNom?: string;
  villeArriveeId: string;
  villeArriveeNom?: string;
  tranchePoids: TranchePoids;
  tarif: number;
}

export interface TarifExpeditionRequest {
  villeDepartId: string;
  villeArriveeId: string;
  tranchePoids: TranchePoids;
  tarif: number;
}

export interface EstimationPrix {
  prixExpedition: number;
  fraisCollecte: number;
  fraisLivraison: number;
  totalEstime: number;
}
