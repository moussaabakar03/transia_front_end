import { Component, Input, OnInit, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { UserService } from '../../../core/services/user-service';
import { VilleService } from '../../../core/services/transport/ville-service';
import { AgenceService } from '../../../core/services/agence.service';
import { CurrentUserService } from '../../../core/services/current-user.service';
import { RoleDTO, RoleName, UserResponse, UserUpdateDTO } from '../../models/users';
import { Ville } from '../../models/ville';
import { Agence } from '../../models/agence.model';

@Component({
  selector: 'app-modal-edit-user',
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-edit-user.html',
  styleUrl: './modal-edit-user.scss',
})
export class ModalEditUser implements OnInit, OnChanges {
  @Input()  utilisateur: UserResponse | null = null;
  @Output() fermer  = new EventEmitter<void>();
  @Output() success = new EventEmitter<any>();

  userData: {
    fullName: string; telephone: string; email: string; password: string;
    villeBaseId: string; villeActuelleId: string; agenceId: string; roles: RoleName[];
  } = { fullName: '', telephone: '', email: '', password: '', villeBaseId: '', villeActuelleId: '', agenceId: '', roles: [] };

  rolesList:       RoleDTO[] = [];
  villes:          Ville[]   = [];
  agences:         Agence[]  = [];
  agencesFiltrees: Agence[]  = [];

  isLoading       = false;
  isLoadingRoles  = false;
  errorMessage    = '';

  constructor(
    private userService:  UserService,
    private villeService: VilleService,
    private agenceService: AgenceService,
    private currentUser: CurrentUserService
  ) {}

  ngOnInit(): void {
    this.isLoadingRoles = true;
    forkJoin({
      roles:   this.userService.getAllRoles(),
      villes:  this.villeService.getAllVilles(),
      agences: this.agenceService.getAll()
    }).subscribe({
      next: r => {
        this.rolesList  = r.roles;
        this.villes     = r.villes  || [];
        this.agences    = r.agences || [];
        this.agencesFiltrees = this.agences;
        if (this.utilisateur) this.chargerDonnees();
        this.isLoadingRoles = false;
      },
      error: () => { this.isLoadingRoles = false; }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['utilisateur'] && this.utilisateur) {
      this.chargerDonnees();
    }
  }

  /** Un ADMIN_AGENCE ne peut pas attribuer SUPER_ADMIN ni ADMIN_AGENCE */
  get rolesSelectionnables(): RoleDTO[] {
    if (this.currentUser.isSuperAdmin()) return this.rolesList;
    return this.rolesList.filter(r => r.name !== 'SUPER_ADMIN' && r.name !== 'ADMIN_AGENCE');
  }

  get isFieldAgent(): boolean {
    return this.userData.roles.includes('CHAUFFEUR') || this.userData.roles.includes('LIVREUR');
  }

  get isAgence(): boolean {
    return this.userData.roles.includes('AGENT_ACCUEIL') || this.userData.roles.includes('ADMIN_AGENCE');
  }

  isRoleSelected(name: RoleName): boolean {
    return this.userData.roles.includes(name);
  }

  toggleRole(name: RoleName): void {
    if (this.isRoleSelected(name)) {
      this.userData.roles = this.userData.roles.filter(r => r !== name);
    } else {
      this.userData.roles = [...this.userData.roles, name];
    }
  }

  onVilleBaseChange(): void {
    this.userData.agenceId = '';
    this.agencesFiltrees = this.userData.villeBaseId
      ? this.agences.filter(a => a.villeId === this.userData.villeBaseId)
      : this.agences;
  }

  private chargerDonnees(): void {
    if (!this.utilisateur) return;
    const u = this.utilisateur;
    this.userData = {
      fullName:        u.fullName,
      telephone:       u.telephone,
      email:           u.email || '',
      password:        '',
      villeBaseId:     u.villeBaseId     || '',
      villeActuelleId: u.villeActuelleId || '',
      agenceId:        u.agenceId        || '',
      roles:           (u.roles || []).map(r => r.name)
    };

    if (this.userData.villeBaseId) {
      this.agencesFiltrees = this.agences.filter(a => a.villeId === this.userData.villeBaseId);
    }
  }

  submit() {
    if (!this.utilisateur) return;
    this.errorMessage = '';

    if (!this.userData.telephone?.trim() || !this.userData.fullName?.trim()) {
      this.errorMessage = 'Veuillez remplir le nom complet et le numéro de téléphone.';
      return;
    }

    if (!this.userData.roles || this.userData.roles.length === 0) {
      this.errorMessage = 'Veuillez sélectionner au moins un rôle.';
      return;
    }

    this.isLoading = true;

    const userPayload: UserUpdateDTO = {
      fullName:        this.userData.fullName,
      telephone:       this.userData.telephone,
      email:           this.userData.email || undefined,
      roles:           this.userData.roles,
      villeBaseId:     this.userData.villeBaseId     || undefined,
      villeActuelleId: this.userData.villeActuelleId || undefined,
      agenceId:        this.userData.agenceId        || undefined
    };

    if (this.userData.password?.trim()) {
      userPayload.password = this.userData.password.trim();
    }

    this.userService.updateUser(this.utilisateur.publicId, userPayload).subscribe({
      next: (user) => { this.isLoading = false; this.success.emit(user); },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Erreur lors de la mise à jour.';
        this.isLoading = false;
      }
    });
  }
}
