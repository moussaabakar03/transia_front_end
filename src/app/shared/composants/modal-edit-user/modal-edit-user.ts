import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user-service';
import { ProfilUtilisateur } from '../../../core/modeles/utilisateurs.model';

@Component({
  selector: 'app-modal-edit-user',
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-edit-user.html',
  styleUrl: './modal-edit-user.scss',
})
export class ModalEditUser implements OnInit {
  @Input() profil: ProfilUtilisateur | null = null;
  @Output() fermer = new EventEmitter<void>();
  @Output() success = new EventEmitter<any>();

  // userData = {
  //   username: '',
  //   email: '',
  //   first_name: '',
  //   role: 'ENQUETEUR'
  // };

  // profilData = {
  //   adresse: '',
  //   telephone: '',
  //   date_naissance: '',
  //   photo_profil: null as File | null
  // };

  userData = {
    username: '',
    first_name: '',
    last_name: '',
    phone: '',
    email: '', 
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

  ngOnInit() {
    if (this.profil) {
      this.userData = {
        username: this.profil.user.username,
        email: this.profil.user.email,
        last_name: this.profil.user.last_name,
        first_name: this.profil.user.first_name || '',
        role: this.profil.user.role,
        phone: this.profil.user.phone,
      };

      this.profilData = {
        adresse: this.profil.adresse || '',
        date_naissance: this.profil.date_naissance ? new Date(this.profil.date_naissance).toISOString().split('T')[0] : '',
        photo_profil: null
      };

      if (this.profil.photo_profil) {
        this.photoPreview = this.profil.photo_profil;
      }
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.profilData.photo_profil = file;
      const reader = new FileReader();
      reader.onload = (e) => this.photoPreview = e.target?.result as string;
      reader.readAsDataURL(file);
    }
  }

  submit() {
    if (!this.profil) return;
    
    this.isLoading = true;

    // Mettre à jour l'utilisateur
    this.userService.updateUser(this.profil.user.id, this.userData).subscribe({
      next: () => {
        // Mettre à jour le profil
        this.updateProfil();
      },
      error: (err) => {
        console.error('Erreur mise à jour utilisateur', err);
        alert('Erreur lors de la mise à jour');
        this.isLoading = false;
      }
    });
  }

  updateProfil() {
    if (!this.profil) return;

    const formData = new FormData();
    formData.append('adresse', this.profilData.adresse);
    formData.append('date_naissance', this.profilData.date_naissance);
    if (this.profilData.photo_profil) {
      formData.append('photo_profil', this.profilData.photo_profil);
    }

    this.userService.updateProfil(this.profil.id, formData).subscribe({
      next: (profil) => {
        this.isLoading = false;
        this.success.emit(profil);
        this.fermer.emit();
      },
      error: (err) => {
        console.error('Erreur mise à jour profil', err);
        alert('Erreur lors de la mise à jour du profil');
        this.isLoading = false;
      }
    });
  }
}
