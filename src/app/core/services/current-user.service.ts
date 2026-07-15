import { Injectable } from '@angular/core';

export interface UserContext {
  id: string;
  publicId: string;
  telephone: string;
  fullName: string;
  roles: string[];
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
  getRoles(): string[]    { return this.getContext()?.roles    || []; }
  getVilleId(): string | null   { return this.getContext()?.villeId   ?? null; }
  getVilleNom(): string | null  { return this.getContext()?.villeNom  ?? null; }
  getAgenceId(): string | null  { return this.getContext()?.agenceId  ?? null; }
  getAgenceNom(): string | null { return this.getContext()?.agenceNom ?? null; }

  hasRole(role: string): boolean {
    const target = role.toUpperCase();
    return this.getRoles().some(r => r.toUpperCase() === target || r.toUpperCase() === `ROLE_${target}`);
  }

  isSuperAdmin(): boolean   { return this.hasRole('SUPER_ADMIN'); }
  isAdminAgence(): boolean  { return this.hasRole('ADMIN_AGENCE'); }
  isAgent(): boolean        { return this.hasRole('AGENT_ACCUEIL'); }

  /** Un SUPER_ADMIN ou un ADMIN_AGENCE peut gérer les comptes utilisateurs */
  peutGererComptes(): boolean { return this.isSuperAdmin() || this.isAdminAgence(); }

  /** Retourne true si l'utilisateur doit voir toutes les agences (pas seulement la sienne) */
  isGlobalView(): boolean { return this.isSuperAdmin(); }

  /** Retourne la première lettre du prénom pour l'avatar */
  getInitiale(): string {
    const n = this.getFullName();
    return n ? n.charAt(0).toUpperCase() : '?';
  }
}
