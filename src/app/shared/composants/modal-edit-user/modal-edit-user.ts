import { Component, Input, OnInit, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { UserService } from '../../../core/services/user-service';
import { VilleService } from '../../../core/services/transport/ville-service';
import { AgenceService } from '../../../core/services/agence.service';
import { ProfilComplet, ProfilDTO, RoleDTO, UserUpdateDTO } from '../../models/users';
import { Ville } from '../../models/ville';
import { Agence } from '../../models/agence.model';

@Component({
  selector: 'app-modal-edit-user',
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-edit-user.html',
  styleUrl: './modal-edit-user.scss',
})
export class ModalEditUser implements OnInit, OnChanges {
  @Input()  profil: ProfilComplet | null = null;
  @Output() fermer  = new EventEmitter<void>();
  @Output() success = new EventEmitter<any>();

  userData: {
    fullName: string; username: string; enable: boolean;
    villeBaseId: string; villeActuelleId: string; agenceId: string;
  } = { fullName: '', username: '', enable: true, villeBaseId: '', villeActuelleId: '', agenceId: '' };

  rolesList:       RoleDTO[] = [];
  villes:          Ville[]   = [];
  agences:         Agence[]  = [];
  agencesFiltrees: Agence[]  = [];

  selectedRoleId: number | null = null;
  profilData: Partial<ProfilDTO> = { adresse: '', telephone: '', photoProfil: null };

  isLoading       = false;
  isLoadingRoles  = false;
  errorMessage    = '';
  photoPreview: string | null = null;

  constructor(
    private userService:  UserService,
    private villeService: VilleService,
    private agenceService: AgenceService
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
        if (this.profil) {
          this.selectedRoleId = this.profil.user.roles?.id ?? r.roles[0]?.id ?? null;
        }
        this.isLoadingRoles = false;
      },
      error: () => { this.isLoadingRoles = false; }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['profil'] && this.profil) {
      this.chargerDonnees();
    }
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

  onRoleChange(): void {
    this.userData.villeBaseId    = '';
    this.userData.villeActuelleId = '';
    this.userData.agenceId       = '';
    this.agencesFiltrees = this.agences;
  }

  onVilleBaseChange(): void {
    this.userData.agenceId = '';
    this.agencesFiltrees = this.userData.villeBaseId
      ? this.agences.filter(a => a.villeId === this.userData.villeBaseId)
      : this.agences;
  }

  private chargerDonnees(): void {
    if (!this.profil) return;
    const u = this.profil.user;
    this.userData = {
      fullName:        u.fullName,
      username:        u.username,
      enable:          u.enable,
      villeBaseId:     u.villeBaseId     || '',
      villeActuelleId: u.villeActuelleId || '',
      agenceId:        u.agenceId        || ''
    };
    this.selectedRoleId = u.roles?.id ?? (this.rolesList[0]?.id ?? null);
    this.profilData = {
      adresse:     this.profil.adresse    || '',
      telephone:   this.profil.telephone  || '',
      photoProfil: this.profil.photoProfil || null
    };
    this.photoPreview = this.profil.photoProfil || null;

    if (this.userData.villeBaseId) {
      this.agencesFiltrees = this.agences.filter(a => a.villeId === this.userData.villeBaseId);
    }
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
    if (!this.profil) return;
    this.errorMessage = '';

    if (!this.userData.username?.trim() || !this.userData.fullName?.trim()) {
      this.errorMessage = 'Veuillez remplir le nom complet et le nom d\'utilisateur.';
      return;
    }

    const roleChoisi = this.rolesList.find(r => r.id === this.selectedRoleId);
    if (!roleChoisi) {
      this.errorMessage = 'Veuillez sélectionner un rôle.';
      return;
    }

    this.isLoading = true;

    const userPayload: UserUpdateDTO = {
      fullName:        this.userData.fullName,
      username:        this.userData.username,
      roles:           roleChoisi,
      enable:          this.userData.enable,
      villeBaseId:     this.userData.villeBaseId     || undefined,
      villeActuelleId: this.userData.villeActuelleId || undefined,
      agenceId:        this.userData.agenceId        || undefined
    };

    this.userService.updateUser(this.profil.user.publicId, userPayload).subscribe({
      next: (user) => this.updateProfil(user),
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Erreur lors de la mise à jour.';
        this.isLoading = false;
      }
    });
  }

  private updateProfil(user: any) {
    const profilPayload: ProfilDTO = {
      userId:      this.profil!.user.id,
      photoProfil: this.profilData.photoProfil || null,
      telephone:   this.profilData.telephone   || '',
      nomComplet:  this.userData.fullName,
      adresse:     this.profilData.adresse     || ''
    };

    this.userService.updateProfil(this.profil!.user.id, profilPayload).subscribe({
      next: (profil) => { this.isLoading = false; this.success.emit({ user, profil }); },
      error: () => { this.isLoading = false; this.fermer.emit(); }
    });
  }
}