import { Colis } from './colis.model';
import { UserResponse } from './users';

export interface Tournee {
  id?: string;
  dateTournee: string;
  livreurId?: string;
  livreur?: UserResponse;
  zone?: string;
  colis?: Colis[];
  statut?: string;
}

export interface TourneeRequest {
  dateTournee: string;
  livreurId: string;
  zone?: string;
  colisIds?: string[];
}
