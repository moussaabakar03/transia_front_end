import { Injectable } from '@angular/core';

export interface UserContext {
  id: string;
  publicId: string;
  username: string;
  fullName: string;
  role: string;
  agenceId:  string | null;
  agenceNom: string | null;
  villeId:   string | null;
  villeNom:  string | null;
}

@Injectable({ providedIn: 'root' })
export class CurrentUserService {

  getContext(): UserContext | null {
    const raw = localStorage.getItem('transia_user');
    if (!raw) return null;
    try { return JSON.parse(raw) as UserContext; } catch { return null; }
  }

  getFullName(): string   { return this.getContext()?.fullName || 'Utilisateur'; }
  getRole(): string       { return this.getContext()?.role     || ''; }
  getVilleId(): string | null   { return this.getContext()?.villeId   ?? null; }
  getVilleNom(): string | null  { return this.getContext()?.villeNom  ?? null; }
  getAgenceId(): string | null  { return this.getContext()?.agenceId  ?? null; }
  getAgenceNom(): string | null { return this.getContext()?.agenceNom ?? null; }

  isAdmin(): boolean  { return this.getRole() === 'ROLE_ADMIN'  || this.getRole() === 'ADMIN'; }
  isAgent(): boolean  { return this.getRole() === 'ROLE_AGENT_ACCUEIL' || this.getRole() === 'AGENT_ACCUEIL'; }

  /** Retourne true si l'utilisateur doit voir toutes les agences */
  isGlobalView(): boolean { return this.isAdmin(); }

  /** Retourne la première lettre du prénom pour l'avatar */
  getInitiale(): string {
    const n = this.getFullName();
    return n ? n.charAt(0).toUpperCase() : '?';
  }
}