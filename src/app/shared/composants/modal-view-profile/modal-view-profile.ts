import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfilUtilisateur } from '../../../core/modeles/utilisateurs.model';

@Component({
  selector: 'app-modal-view-profile',
  imports: [CommonModule],
  templateUrl: './modal-view-profile.html',
  styleUrl: './modal-view-profile.scss',
}) 
export class ModalViewProfile {
  @Input() profil: ProfilUtilisateur | null = null;
  @Output() fermer = new EventEmitter<void>();
  @Input() titre: string = "Profil Utilisateur"

  getRoleLabel(role: string): string {
    const roles: { [key: string]: string } = {
      'SUPER_ADMIN': 'Super Administrateur',
      'ADMIN': 'Administrateur',
      'MANAGER': 'Gestionnaire',
      'ENQUETEUR': 'Enquêteur'
    };
    return roles[role] || role;
  }

  getStatusClass(isActive: boolean): string {
    return isActive ? 'active' : 'inactive';
  }
}
