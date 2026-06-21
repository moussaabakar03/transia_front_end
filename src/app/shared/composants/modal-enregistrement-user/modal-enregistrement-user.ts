import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user-service';
import { ProfilDTO, UserCreateDTO, RoleDTO } from '../../models/users';

@Component({
  selector: 'app-modal-enregistrement-user',
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-enregistrement-user.html',
  styleUrl: './modal-enregistrement-user.scss',
})
export class ModalEnregistrementUser implements OnInit {
  @Output() fermer = new EventEmitter<void>();
  @Output() success = new EventEmitter<any>();

  userData: UserCreateDTO = {
    fullName: '',
    username: '',
    password: '',
    roles: null,
    enable: true
  };

  rolesList: RoleDTO[] = [];
  selectedRoleId: number | null = null;

  profilData: Partial<ProfilDTO> = {
    adresse: '',
    telephone: '',
    photoProfil: null
  };

  isLoading = false;
  isLoadingRoles = false;
  photoPreview: string | null = null;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.isLoadingRoles = true;
    this.userService.getAllRoles().subscribe({
      next: (roles) => {
        this.rolesList = roles;
        if (roles.length > 0) this.selectedRoleId = roles[0].id;
        this.isLoadingRoles = false;
      },
      error: (err) => {
        console.error('Erreur chargement rôles', err);
        this.isLoadingRoles = false;
      }
    });
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
    if (!this.userData.username || !this.userData.password || !this.userData.fullName) {
      alert('Veuillez remplir tous les champs obligatoires (nom, identifiant, mot de passe)');
      return;
    }

    const roleChoisi = this.rolesList.find(r => r.id === this.selectedRoleId);
    if (!roleChoisi) {
      alert('Veuillez sélectionner un rôle');
      return;
    }

    this.userData.roles = roleChoisi;
    this.isLoading = true;

    this.userService.createUser(this.userData).subscribe({
      next: (user) => this.createProfil(user.id, user),
      error: (err) => {
        console.error('Erreur création utilisateur', err);
        alert('Erreur lors de la création du compte utilisateur');
        this.isLoading = false;
      }
    });
  }

  createProfil(userId: number, user: any) {
    const profilPayload: ProfilDTO = {
      userId: userId,
      photoProfil: this.profilData.photoProfil || null,
      telephone: this.profilData.telephone || '',
      nomComplet: this.userData.fullName,
      adresse: this.profilData.adresse || ''
    };

    this.userService.createProfil(profilPayload).subscribe({
      next: (profil) => {
        this.isLoading = false;
        this.success.emit({ userId, user, profil });
        this.resetForm();
        this.fermer.emit();
      },
      error: (err) => {
        console.error('Erreur création profil', err);
        alert('Utilisateur créé mais erreur lors de la création du profil');
        this.isLoading = false;
        this.fermer.emit();
      }
    });
  }

  resetForm() {
    this.userData = { fullName: '', username: '', password: '', roles: null, enable: true };
    this.selectedRoleId = this.rolesList.length > 0 ? this.rolesList[0].id : null;
    this.profilData = { adresse: '', telephone: '', photoProfil: null };
    this.photoPreview = null;
  }
}