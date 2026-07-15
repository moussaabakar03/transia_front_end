import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserResponse } from '../../models/users';

@Component({
  selector: 'app-modal-view-profile',
  imports: [CommonModule],
  templateUrl: './modal-view-profile.html',
  styleUrl: './modal-view-profile.scss',
})
export class ModalViewProfile {
  @Input() utilisateur: UserResponse | null = null;
  @Output() fermer = new EventEmitter<void>();
  @Input() titre: string = "Profil Utilisateur"

  getRoleLabel(role: string): string {
    const roles: { [key: string]: string } = {
      'SUPER_ADMIN': 'Super Administrateur',
      'ADMIN_AGENCE': "Administrateur d'agence",
      'AGENT_ACCUEIL': "Agent d'accueil",
      'CLIENT': 'Client',
      'CHAUFFEUR': 'Chauffeur',
      'LIVREUR': 'Livreur'
    };
    return roles[role] || role;
  }

  rolesLabel(): string {
    return (this.utilisateur?.roles || []).map(r => this.getRoleLabel(r.name)).join(', ');
  }

  getStatusClass(): string {
    return this.utilisateur?.statutCompte === 'ACTIF' ? 'active' : 'inactive';
  }
}
