import { DemandeCollecte } from './demande-collecte.model';
import { UserResponse } from './users';

export interface Tournee {
  id?: string;
  dateTournee: string;
  livreurId?: string;
  livreur?: UserResponse;
  zone?: string;
  demandesCollecte?: DemandeCollecte[];
  statut?: string;
}

export interface TourneeRequest {
  dateTournee: string;
  livreurId: string;
  zone?: string;
  demandeIds?: string[];
}
