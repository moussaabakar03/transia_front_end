import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Sidebar } from '../../shared/composants/sidebar/sidebar';
import { Header } from '../../shared/composants/header/header';
import { UserService } from '../../core/services/user-service';
import { ModalEnregistrementUser } from '../../shared/composants/modal-enregistrement-user/modal-enregistrement-user';
import { ModalEditUser } from '../../shared/composants/modal-edit-user/modal-edit-user';
import { ModalDeleteUser } from '../../shared/composants/modal-delete-user/modal-delete-user';
import { ModalViewProfile } from '../../shared/composants/modal-view-profile/modal-view-profile';
import { ProfilComplet } from '../../shared/models/users';

@Component({
  selector: 'app-gestion-comptes',
  standalone: true,
  imports: [CommonModule, Sidebar, Header, ModalEnregistrementUser, ModalEditUser, ModalDeleteUser, ModalViewProfile, FormsModule],
  templateUrl: './gestion-comptes.html',
  styleUrl: './gestion-comptes.scss'
})
export class GestionComptes implements OnInit {
  // Affichage paginé - maintenant un tableau
  comptesAffiches: ProfilComplet[] = [];

  // États des modales
  afficherChoixGlobal: boolean = false;
  afficherCreationCompte: boolean = false;
  afficherEditCompte: boolean = false;
  afficherDeleteCompte: boolean = false;
  afficherViewProfile: boolean = false;

  // Données éditées/supprimées
  profilEditer: ProfilComplet | null = null;
  profilVoir: ProfilComplet | null = null;
  userIdDelete: string | null = null;
  userNameDelete: string = '';
  titreViewProfil: string = "Profil Utilisateur";

  // Pagination
  pageActuelle: number = 1;
  readonly parPage: number = 5;
  totalComptes: number = 0;

  // Recherche
  valeurSaisi: string = '';

  // Sources de données
  tousLesProfils: ProfilComplet[] = [];
  resultatsFiltres: ProfilComplet[] = [];

  constructor(private utilisateursService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.utilisateursService.getProfilsComplets().subscribe({
      next: (data) => {
        this.tousLesProfils = data;
        this.resultatsFiltres = [...data];
        console.log(this.resultatsFiltres);
        this.totalComptes = this.resultatsFiltres.length;
        this.pageActuelle = 1;
        this.appliquerPage();
      },
      error: (err) => console.error('Erreur chargement profils utilisateurs', err)
    });
  }

  filtrerProfils(): void {
    if (!this.valeurSaisi.trim()) {
      this.resultatsFiltres = [...this.tousLesProfils];
    } else {
      const terme = this.valeurSaisi.toLowerCase().trim();
      this.resultatsFiltres = this.tousLesProfils.filter(profil =>
        profil.user.username?.toLowerCase().includes(terme) ||
        profil.user.fullName?.toLowerCase().includes(terme) ||
        profil.adresse?.toLowerCase().includes(terme) ||
        profil.telephone?.includes(terme) ||
        profil.user.roles.name?.toLowerCase().includes(terme)
      );
    }
    this.totalComptes = this.resultatsFiltres.length;
    this.pageActuelle = 1;
    this.appliquerPage();
  }

  private appliquerPage(): void {
    const debut = (this.pageActuelle - 1) * this.parPage;
    this.comptesAffiches = this.resultatsFiltres.slice(debut, debut + this.parPage);
  }

  get totalPages(): number {
    return Math.ceil(this.totalComptes / this.parPage);
  }

  pagePrecedente(): void {
    if (this.pageActuelle > 1) {
      this.pageActuelle--;
      this.appliquerPage();
    }
  }

  pageSuivante(): void {
    if (this.pageActuelle < this.totalPages) {
      this.pageActuelle++;
      this.appliquerPage();
    }
  }

  changerPage(p: number): void {
    this.pageActuelle = p;
    this.appliquerPage();
  }

  suspendreCompte(publicId: string): void {
    const profil = this.tousLesProfils.find(p => p.user.publicId === publicId);
    if (!profil) return;

    if (confirm(`Voulez-vous suspendre temporairement les accès de ${profil.user.username}?`)) {
      const payload = {
        fullName: profil.user.fullName,
        username: profil.user.username,
        roles: profil.user.roles,
        enable: false
      };
      this.utilisateursService.updateUser(publicId, payload).subscribe({
        next: () => {
          alert(`Les droits d'accès de ${profil.user.username} ont été révoqués.`);
          this.loadUsers();
        },
        error: (err) => {
          console.error('Erreur suspension compte', err);
          alert('Erreur lors de la suspension du compte');
        }
      });
    }
  }

  activerCompte(publicId: string): void {
    const profil = this.tousLesProfils.find(p => p.user.publicId === publicId);
    if (!profil) return;

    const payload = {
      fullName: profil.user.fullName,
      username: profil.user.username,
      roles: profil.user.roles,
      enable: true
    };
    this.utilisateursService.updateUser(publicId, payload).subscribe({
      next: () => {
        alert(`Le compte de ${profil.user.username} a été réactivé.`);
        this.loadUsers();
      },
      error: (err) => {
        console.error('Erreur activation compte', err);
        alert('Erreur lors de la réactivation du compte');
      }
    });
  }

  ouvrirSelectionGlobale(): void {
    this.afficherChoixGlobal = true;
  }

  fermerSelectionGlobale(): void {
    this.afficherChoixGlobal = false;
  }

  ouvrirModaleCompte(): void {
    this.afficherCreationCompte = true;
  }

  fermerCreationCompte(): void {
    this.afficherCreationCompte = false;
    this.valeurSaisi = '';
    this.loadUsers();
  }

  ouvrirEditCompte(profil: ProfilComplet): void {
    this.profilEditer = profil;
    this.afficherEditCompte = true;
  }

  fermerEditCompte(): void {
    this.afficherEditCompte = false;
    this.profilEditer = null;
  }

  onEditSuccess(): void {
    this.fermerEditCompte();
    this.valeurSaisi = '';
    this.loadUsers();
  }

  ouvrirViewProfile(profil: ProfilComplet): void {
    this.profilVoir = profil;
    this.afficherViewProfile = true;
  }

  fermerViewProfile(): void {
    this.afficherViewProfile = false;
    this.profilVoir = null;
  }

  ouvrirDeleteCompte(publicId: string, userName: string): void {
    this.userIdDelete = publicId;
    this.userNameDelete = userName;
    this.afficherDeleteCompte = true;
  }

  fermerDeleteCompte(): void {
    this.afficherDeleteCompte = false;
    this.userIdDelete = null;
    this.userNameDelete = '';
  }

  onDeleteSuccess(): void {
    this.fermerDeleteCompte();
    this.valeurSaisi = '';
    this.loadUsers();
  }
}