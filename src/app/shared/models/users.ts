export type RoleName =
  | 'SUPER_ADMIN'
  | 'ADMIN_AGENCE'
  | 'AGENT_ACCUEIL'
  | 'CLIENT'
  | 'CHAUFFEUR'
  | 'LIVREUR';

export type StatutCompte = 'ACTIF' | 'INACTIF' | 'BLOQUE' | 'SUPPRIME';

export interface RoleDTO {
  id: number;
  publicId?: string;
  name: RoleName;
}

export interface UserResponse {
  id: number;
  publicId: string;
  fullName: string;
  telephone: string;
  email?: string;
  statutCompte: StatutCompte;
  roles: RoleDTO[];
  createdAt?: string;
  agenceId?: string;
  agenceNom?: string;
  villeNom?: string;
  villeBaseId?: string;
  villeBaseNom?: string;
  villeActuelleId?: string;
  villeActuelleNom?: string;
  statutOperationnel?: string;
  /** Lecture seule — photo de profil de l'utilisateur si elle existe (jamais modifiable par un admin) */
  photoProfil?: string | null;
}

export interface UserCreateDTO {
  fullName: string;
  telephone: string;
  email?: string;
  password: string;
  roles: RoleName[];
  villeBaseId?: string;
  villeActuelleId?: string;
  agenceId?: string;
  statutOperationnel?: string;
}

export interface UserUpdateDTO {
  fullName: string;
  telephone: string;
  email?: string;
  password?: string;
  roles: RoleName[];
  villeBaseId?: string;
  villeActuelleId?: string;
  agenceId?: string;
  statutOperationnel?: string;
}

/** Profil personnel (photo, adresse) — toujours self-service, jamais consulté pour un autre utilisateur */
export interface ProfilDTO {
  id?: string;
  userId?: number;
  photoProfil: string | null;
  adresse: string;
}
