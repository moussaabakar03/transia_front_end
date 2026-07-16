import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { UserService } from '../../../core/services/user-service';
import { VilleService } from '../../../core/services/transport/ville-service';
import { AgenceService } from '../../../core/services/agence.service';
import { CurrentUserService } from '../../../core/services/current-user.service';
import { RoleDTO, RoleName, UserCreateDTO } from '../../models/users';
import { Ville } from '../../models/ville';
import { Agence } from '../../models/agence.model';

@Component({
  selector: 'app-modal-enregistrement-user',
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-enregistrement-user.html',
  styleUrl: './modal-enregistrement-user.scss',
})
export class ModalEnregistrementUser implements OnInit {
  @Output() fermer  = new EventEmitter<void>();
  @Output() success = new EventEmitter<any>();

  userData: UserCreateDTO = {
    fullName: '', telephone: '', email: '', password: '',
    roles: [], villeBaseId: '', villeActuelleId: '', agenceId: ''
  };

  rolesList:  RoleDTO[]  = [];
  villes:     Ville[]    = [];
  agences:    Agence[]   = [];
  agencesFiltrees: Agence[] = [];

  isLoading        = false;
  isLoadingRoles   = false;
  isLoadingVilles  = false;
  errorMessage = '';

  constructor(
    private userService: UserService,
    private villeService: VilleService,
    private agenceService: AgenceService,
    private currentUser: CurrentUserService
  ) {}

  ngOnInit(): void {
    this.isLoadingRoles  = true;
    this.isLoadingVilles = true;

    forkJoin({
      roles:   this.userService.getAllRoles(),
      villes:  this.villeService.getAllVilles(),
      agences: this.agenceService.getAll()
    }).subscribe({
      next: r => {
        this.rolesList  = r.roles;
        this.villes     = r.villes || [];
        this.agences    = r.agences || [];
        this.agencesFiltrees = this.agences;
        this.isLoadingRoles  = false;
        this.isLoadingVilles = false;
      },
      error: () => {
        this.isLoadingRoles  = false;
        this.isLoadingVilles = false;
      }
    });
  }

  /** Un ADMIN_AGENCE ne peut pas créer un SUPER_ADMIN ni un autre ADMIN_AGENCE */
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

  get needsVille(): boolean {
    return this.isFieldAgent || this.isAgence;
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
    this.userData.villeBaseId     = '';
    this.userData.villeActuelleId = '';
    this.userData.agenceId        = '';
    this.agencesFiltrees = this.agences;
  }

  onVilleBaseChange(): void {
    if (!this.userData.villeBaseId) { this.agencesFiltrees = this.agences; return; }
    this.agencesFiltrees = this.agences.filter(a => a.villeId === this.userData.villeBaseId);
    this.userData.agenceId = '';
  }

  submit() {
    this.errorMessage = '';

    if (!this.userData.telephone?.trim() || !this.userData.password?.trim() || !this.userData.fullName?.trim()) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires (nom, téléphone, mot de passe).';
      return;
    }

    if (!this.userData.roles || this.userData.roles.length === 0) {
      this.errorMessage = 'Veuillez sélectionner au moins un rôle.';
      return;
    }

    this.isLoading = true;

    this.userService.createUser(this.userData).subscribe({
      next: (user) => {
        this.isLoading = false;
        this.success.emit(user);
        this.resetForm();
        this.fermer.emit();
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Erreur lors de la création du compte.';
        this.isLoading = false;
      }
    });
  }

  resetForm() {
    this.userData = {
      fullName: '', telephone: '', email: '', password: '',
      roles: [], villeBaseId: '', villeActuelleId: '', agenceId: ''
    };
    this.errorMessage    = '';
    this.agencesFiltrees = this.agences;
  }
}
