import { Component, Input, OnInit, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user-service';
import { ProfilComplet, ProfilDTO, RoleDTO, UserUpdateDTO } from '../../models/users';

@Component({
  selector: 'app-modal-edit-user',
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-edit-user.html',
  styleUrl: './modal-edit-user.scss',
})
export class ModalEditUser implements OnInit, OnChanges {
  @Input() profil: ProfilComplet | null = null;
  @Output() fermer = new EventEmitter<void>();
  @Output() success = new EventEmitter<any>();

  userData = { fullName: '', username: '', enable: true };
  rolesList: RoleDTO[] = [];
  selectedRoleId: number | null = null;

  profilData: Partial<ProfilDTO> = { adresse: '', telephone: '', photoProfil: null };

  isLoading = false;
  isLoadingRoles = false;
  photoPreview: string | null = null;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.isLoadingRoles = true;
    this.userService.getAllRoles().subscribe({
      next: (roles) => {
        this.rolesList = roles;
        if (this.profil) {
          this.selectedRoleId = this.profil.user.roles?.id ?? roles[0]?.id ?? null;
        }
        this.isLoadingRoles = false;
      },
      error: (err) => {
        console.error('Erreur chargement rôles', err);
        this.isLoadingRoles = false;
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['profil'] && this.profil) {
      this.chargerDonnees();
    }
  }

  private chargerDonnees(): void {
    if (!this.profil) return;
    this.userData = {
      fullName: this.profil.user.fullName,
      username: this.profil.user.username,
      enable: this.profil.user.enable
    };
    this.selectedRoleId = this.profil.user.roles?.id ?? (this.rolesList[0]?.id ?? null);
    this.profilData = {
      adresse: this.profil.adresse || '',
      telephone: this.profil.telephone || '',
      photoProfil: this.profil.photoProfil || null
    };
    this.photoPreview = this.profil.photoProfil || null;
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

    if (!this.userData.username || !this.userData.fullName) {
      alert('Veuillez remplir tous les champs obligatoires (nom, identifiant)');
      return;
    }

    const roleChoisi = this.rolesList.find(r => r.id === this.selectedRoleId);
    if (!roleChoisi) {
      alert('Veuillez sélectionner un rôle');
      return;
    }

    this.isLoading = true;

    const userPayload: UserUpdateDTO = {
      fullName: this.userData.fullName,
      username: this.userData.username,
      roles: roleChoisi,
      enable: this.userData.enable
    };

    this.userService.updateUser(this.profil.user.publicId, userPayload).subscribe({
      next: (user) => this.updateProfil(user),
      error: (err) => {
        console.error('Erreur mise à jour utilisateur', err);
        alert("Erreur lors de la mise à jour de l'utilisateur");
        this.isLoading = false;
      }
    });
  }

  private updateProfil(user: any) {
    const profilPayload: ProfilDTO = {
      userId: this.profil!.user.id,
      photoProfil: this.profilData.photoProfil || null,
      telephone: this.profilData.telephone || '',
      nomComplet: this.userData.fullName,
      adresse: this.profilData.adresse || ''
    };

    this.userService.updateProfil(this.profil!.user.id, profilPayload).subscribe({
      next: (profil) => {
        this.isLoading = false;
        this.success.emit({ user, profil });
      },
      error: (err) => {
        console.error('Erreur mise à jour profil', err);
        alert('Utilisateur mis à jour mais erreur lors de la mise à jour du profil');
        this.isLoading = false;
        this.fermer.emit();
      }
    });
  }
}