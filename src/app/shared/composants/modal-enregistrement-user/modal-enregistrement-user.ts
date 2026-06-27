import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { UserService } from '../../../core/services/user-service';
import { VilleService } from '../../../core/services/transport/ville-service';
import { AgenceService } from '../../../core/services/agence.service';
import { ProfilDTO, UserCreateDTO, RoleDTO } from '../../models/users';
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
    fullName: '', username: '', password: '',
    roles: null, enable: true,
    villeBaseId: '', villeActuelleId: '', agenceId: ''
  };

  rolesList:  RoleDTO[]  = [];
  villes:     Ville[]    = [];
  agences:    Agence[]   = [];
  agencesFiltrees: Agence[] = [];

  selectedRoleId: number | null = null;

  profilData: Partial<ProfilDTO> = { adresse: '', telephone: '', photoProfil: null };

  isLoading        = false;
  isLoadingRoles   = false;
  isLoadingVilles  = false;
  photoPreview: string | null = null;
  errorMessage = '';

  constructor(
    private userService: UserService,
    private villeService: VilleService,
    private agenceService: AgenceService
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
        if (r.roles.length > 0) this.selectedRoleId = r.roles[0].id;
        this.isLoadingRoles  = false;
        this.isLoadingVilles = false;
      },
      error: () => {
        this.isLoadingRoles  = false;
        this.isLoadingVilles = false;
      }
    });
  }

  get selectedRole(): RoleDTO | undefined {
    return this.rolesList.find(r => r.id === this.selectedRoleId);
  }

  get isFieldAgent(): boolean {
    const n = this.selectedRole?.name;
    return n === 'CHAUFFEUR' || n === 'LIVREUR';
  }

  get isAgent(): boolean {
    return this.selectedRole?.name === 'AGENT_ACCUEIL';
  }

  get needsVille(): boolean {
    return this.isFieldAgent || this.isAgent;
  }

  onVilleBaseChange(): void {
    if (!this.userData.villeBaseId) { this.agencesFiltrees = this.agences; return; }
    this.agencesFiltrees = this.agences.filter(a => a.villeId === this.userData.villeBaseId);
    this.userData.agenceId = '';
  }

  onRoleChange(): void {
    this.userData.villeBaseId   = '';
    this.userData.villeActuelleId = '';
    this.userData.agenceId      = '';
    this.agencesFiltrees = this.agences;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.photoPreview = e.target.result;
        this.profilData.photoProfil = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  submit() {
    this.errorMessage = '';

    if (!this.userData.username?.trim() || !this.userData.password?.trim() || !this.userData.fullName?.trim()) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires (nom, identifiant, mot de passe).';
      return;
    }

    const roleChoisi = this.rolesList.find(r => r.id === this.selectedRoleId);
    if (!roleChoisi) {
      this.errorMessage = 'Veuillez sélectionner un rôle.';
      return;
    }

    this.userData.roles = roleChoisi;
    this.isLoading = true;

    this.userService.createUser(this.userData).subscribe({
      next: (user) => this.createProfil(user.id, user),
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Erreur lors de la création du compte.';
        this.isLoading = false;
      }
    });
  }

  createProfil(userId: number, user: any) {
    const payload: ProfilDTO = {
      userId,
      photoProfil:  this.profilData.photoProfil || null,
      telephone:    this.profilData.telephone   || '',
      nomComplet:   this.userData.fullName,
      adresse:      this.profilData.adresse     || ''
    };

    this.userService.createProfil(payload).subscribe({
      next: (profil) => {
        this.isLoading = false;
        this.success.emit({ userId, user, profil });
        this.resetForm();
        this.fermer.emit();
      },
      error: () => {
        this.isLoading = false;
        this.fermer.emit();
      }
    });
  }

  resetForm() {
    this.userData = {
      fullName: '', username: '', password: '',
      roles: null, enable: true,
      villeBaseId: '', villeActuelleId: '', agenceId: ''
    };
    this.selectedRoleId      = this.rolesList.length > 0 ? this.rolesList[0].id : null;
    this.profilData          = { adresse: '', telephone: '', photoProfil: null };
    this.photoPreview        = null;
    this.errorMessage        = '';
    this.agencesFiltrees     = this.agences;
  }
}