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
import { UserResponse } from '../../shared/models/users';

@Component({
  selector: 'app-gestion-comptes',
  standalone: true,
  imports: [CommonModule, Sidebar, Header, ModalEnregistrementUser, ModalEditUser, ModalDeleteUser, ModalViewProfile, FormsModule],
  templateUrl: './gestion-comptes.html',
  styleUrl: './gestion-comptes.scss'
})
export class GestionComptes implements OnInit {
  // Affichage paginé
  comptesAffiches: UserResponse[] = [];

  // États des modales
  afficherChoixGlobal: boolean = false;
  afficherCreationCompte: boolean = false;
  afficherEditCompte: boolean = false;
  afficherDeleteCompte: boolean = false;
  afficherViewProfile: boolean = false;

  // Données éditées/supprimées
  utilisateurEditer: UserResponse | null = null;
  utilisateurVoir: UserResponse | null = null;
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
  tousLesUtilisateurs: UserResponse[] = [];
  resultatsFiltres: UserResponse[] = [];

  constructor(private utilisateursService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.utilisateursService.getUsers().subscribe({
      next: (data) => {
        this.tousLesUtilisateurs = data;
        this.resultatsFiltres = [...data];
        this.totalComptes = this.resultatsFiltres.length;
        this.pageActuelle = 1;
        this.appliquerPage();
      },
      error: (err) => console.error('Erreur chargement des utilisateurs', err)
    });
  }

  filtrerProfils(): void {
    if (!this.valeurSaisi.trim()) {
      this.resultatsFiltres = [...this.tousLesUtilisateurs];
    } else {
      const terme = this.valeurSaisi.toLowerCase().trim();
      this.resultatsFiltres = this.tousLesUtilisateurs.filter(u =>
        u.fullName?.toLowerCase().includes(terme) ||
        u.telephone?.includes(terme) ||
        u.email?.toLowerCase().includes(terme) ||
        u.roles?.some(r => r.name.toLowerCase().includes(terme))
      );
    }
    this.totalComptes = this.resultatsFiltres.length;
    this.pageActuelle = 1;
    this.appliquerPage();
  }

  rolesLabel(u: UserResponse): string {
    return (u.roles || []).map(r => r.name).join(', ');
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
    const u = this.tousLesUtilisateurs.find(x => x.publicId === publicId);
    if (!u) return;

    if (confirm(`Voulez-vous suspendre temporairement les accès de ${u.fullName} ?`)) {
      this.utilisateursService.suspendreCompte(publicId).subscribe({
        next: () => {
          alert(`Les droits d'accès de ${u.fullName} ont été révoqués.`);
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
    const u = this.tousLesUtilisateurs.find(x => x.publicId === publicId);
    if (!u) return;

    this.utilisateursService.activerCompte(publicId).subscribe({
      next: () => {
        alert(`Le compte de ${u.fullName} a été réactivé.`);
        this.loadUsers();
      },
      error: (err) => {
        console.error('Erreur activation compte', err);
        alert('Erreur lors de la réactivation du compte');
      }
    });
  }

  bloquerCompte(publicId: string): void {
    const u = this.tousLesUtilisateurs.find(x => x.publicId === publicId);
    if (!u) return;

    if (confirm(`Voulez-vous bloquer le compte de ${u.fullName} ? (sanction, plus fort qu'une suspension)`)) {
      this.utilisateursService.bloquerCompte(publicId).subscribe({
        next: () => {
          alert(`Le compte de ${u.fullName} a été bloqué.`);
          this.loadUsers();
        },
        error: (err) => {
          console.error('Erreur blocage compte', err);
          alert('Erreur lors du blocage du compte');
        }
      });
    }
  }

  reinitialiserMotDePasse(publicId: string): void {
    const u = this.tousLesUtilisateurs.find(x => x.publicId === publicId);
    if (!u) return;

    if (!confirm(`Générer un nouveau mot de passe temporaire pour ${u.fullName} ?`)) return;

    this.utilisateursService.reinitialiserMotDePasse(publicId).subscribe({
      next: (res) => {
        alert(`Mot de passe temporaire pour ${u.fullName} : ${res.message}\nCommuniquez-le à l'utilisateur de façon sécurisée.`);
      },
      error: (err) => {
        console.error('Erreur réinitialisation mot de passe', err);
        alert('Erreur lors de la réinitialisation du mot de passe');
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

  ouvrirEditCompte(utilisateur: UserResponse): void {
    this.utilisateurEditer = utilisateur;
    this.afficherEditCompte = true;
  }

  fermerEditCompte(): void {
    this.afficherEditCompte = false;
    this.utilisateurEditer = null;
  }

  onEditSuccess(): void {
    this.fermerEditCompte();
    this.valeurSaisi = '';
    this.loadUsers();
  }

  ouvrirViewProfile(utilisateur: UserResponse): void {
    this.utilisateurVoir = utilisateur;
    this.afficherViewProfile = true;
  }

  fermerViewProfile(): void {
    this.afficherViewProfile = false;
    this.utilisateurVoir = null;
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
