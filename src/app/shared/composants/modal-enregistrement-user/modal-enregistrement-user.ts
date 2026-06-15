
import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user-service';


@Component({
  selector: 'app-modal-enregistrement-user',
  imports: [CommonModule, FormsModule ],
  templateUrl: './modal-enregistrement-user.html',
  styleUrl: './modal-enregistrement-user.scss',
})
export class ModalEnregistrementUser {
  @Output() fermer = new EventEmitter<void>();
  @Output() success = new EventEmitter<any>();

  userData = {
    username: '',
    first_name: '',
    last_name: '',
    phone: '',
    email: '', 
    password: '',
    role: 'ENQUETEUR',
  };

  profilData = {
    adresse: '',
    date_naissance: '',
    photo_profil: null as File | null
  };

  isLoading = false;
  photoPreview: string | null = null;

  constructor(private userService: UserService) {}

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.profilData.photo_profil = file;
      // Aperçu
      const reader = new FileReader();
      reader.onload = (e) => this.photoPreview = e.target?.result as string;
      reader.readAsDataURL(file);
    }
  }

  submit() {
    if (!this.userData.username || !this.userData.email || !this.userData.password) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }
    this.isLoading = true;

    this.userService.createUser(this.userData).subscribe({
      next: (user) => {
        console.log('Utilisateur créé :', user);
        // Créer le profil immédiatement après l'utilisateur
        this.createProfil(user.id);
      },
      error: (err) => {
        console.error('Erreur création utilisateur', err);
        alert('Erreur lors de la création du compte utilisateur');
        this.isLoading = false;
      }
    });
  }

  createProfil(userId: string) {
    const formData = new FormData();
    formData.append('user_id', userId);  // ← Changé de 'user' à 'user_id'
    if (this.profilData.adresse) formData.append('adresse', this.profilData.adresse);
    // if (this.profilData.telephone) formData.append('telephone', this.profilData.telephone);
    if (this.profilData.date_naissance) formData.append('date_naissance', this.profilData.date_naissance);
    if (this.profilData.photo_profil) formData.append('photo_profil', this.profilData.photo_profil);

    this.userService.createProfil(formData).subscribe({
      next: (profil) => {
        console.log('Profil créé :', profil);
        this.isLoading = false;
        this.success.emit({ userId, profil });
        // Réinitialiser le formulaire
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
    this.userData = {
      username: '',
      first_name: '',
      last_name: '',
      phone: '',
      email: '',
      password: '',
      role: 'ENQUETEUR'
    };
    this.profilData = {
      adresse: '',
      date_naissance: '',
      photo_profil: null
    };
    this.photoPreview = null;
  }

 
}