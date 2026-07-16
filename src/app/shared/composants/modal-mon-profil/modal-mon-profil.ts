import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { UserService } from '../../../core/services/user-service';
import { ProfilDTO, UserResponse } from '../../models/users';

@Component({
  selector: 'app-modal-mon-profil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-mon-profil.html',
  styleUrl: './modal-mon-profil.scss',
})
export class ModalMonProfil implements OnInit {
  @Output() fermer = new EventEmitter<void>();
  @Output() success = new EventEmitter<void>();

  ongletActif: 'infos' | 'profil' | 'mot-de-passe' = 'infos';

  utilisateur: UserResponse | null = null;
  profilExistant = false;

  infosData = { fullName: '', telephone: '', email: '' };
  profilData: ProfilDTO = { photoProfil: null, adresse: '' };
  photoPreview: string | null = null;

  passwordData = { currentPassword: '', newPassword: '', confirmPassword: '' };

  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.userService.getMe().subscribe({
      next: (u) => {
        this.utilisateur = u;
        this.infosData = { fullName: u.fullName, telephone: u.telephone, email: u.email || '' };
      },
      error: (err) => console.error('Erreur chargement de mon profil', err)
    });

    this.userService.getMyProfil().pipe(
      catchError(() => of(null))
    ).subscribe(p => {
      if (p) {
        this.profilExistant = true;
        this.profilData = p;
        this.photoPreview = p.photoProfil;
      }
    });
  }

  changerOnglet(onglet: 'infos' | 'profil' | 'mot-de-passe'): void {
    this.ongletActif = onglet;
    this.errorMessage = '';
    this.successMessage = '';
  }

  rolesLabel(): string {
    return (this.utilisateur?.roles || []).map(r => r.name).join(', ');
  }

  enregistrerInfos(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.infosData.fullName.trim() || !this.infosData.telephone.trim()) {
      this.errorMessage = 'Le nom complet et le téléphone sont obligatoires.';
      return;
    }

    this.isLoading = true;
    this.userService.updateMe(this.infosData).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Vos informations ont été mises à jour.';
        this.success.emit();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message || 'Erreur lors de la mise à jour.';
      }
    });
  }

  onFileSelected(event: any): void {
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

  enregistrerProfil(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.isLoading = true;

    const appel = this.profilExistant
      ? this.userService.updateMyProfil(this.profilData)
      : this.userService.createMyProfil(this.profilData);

    appel.subscribe({
      next: () => {
        this.isLoading = false;
        this.profilExistant = true;
        this.successMessage = 'Votre profil a été mis à jour.';
        this.success.emit();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message || 'Erreur lors de la mise à jour du profil.';
      }
    });
  }

  changerMotDePasse(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.passwordData.currentPassword || !this.passwordData.newPassword) {
      this.errorMessage = 'Veuillez remplir tous les champs.';
      return;
    }

    if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
      this.errorMessage = 'Les nouveaux mots de passe ne correspondent pas.';
      return;
    }

    this.isLoading = true;
    this.userService.changeMyPassword(this.passwordData.currentPassword, this.passwordData.newPassword).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Votre mot de passe a été modifié.';
        this.passwordData = { currentPassword: '', newPassword: '', confirmPassword: '' };
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message || 'Erreur lors du changement de mot de passe.';
      }
    });
  }
}
