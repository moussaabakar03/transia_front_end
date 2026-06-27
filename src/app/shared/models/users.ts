export interface RoleDTO {
  id: number;
  publicId?: string;
  name: 'ADMIN' | 'AGENT_ACCUEIL' | 'CLIENT' | 'CHAUFFEUR' | 'LIVREUR';
}

export interface UserResponse {
  id: number;
  publicId: string;
  fullName: string;
  username: string;
  enable: boolean;
  roles: RoleDTO;
  createdAt?: string;
  villeBaseId?: string;
  villeBaseNom?: string;
  villeActuelleId?: string;
  villeActuelleNom?: string;
  agenceId?: string;
  statutOperationnel?: string;
}

export interface UserCreateDTO {
  fullName: string;
  username: string;
  password: string;
  roles: RoleDTO | null;
  enable?: boolean;
  villeBaseId?: string;
  villeActuelleId?: string;
  agenceId?: string;
}

export interface UserUpdateDTO {
  fullName: string;
  username: string;
  roles: RoleDTO | null;
  enable: boolean;
  villeBaseId?: string;
  villeActuelleId?: string;
  agenceId?: string;
}

export interface ProfilDTO {
  id?: string;
  userId: number;
  photoProfil: string | null;
  telephone: string;
  nomComplet: string;
  adresse: string;
}

export interface ProfilComplet extends ProfilDTO {
  user: UserResponse;
}