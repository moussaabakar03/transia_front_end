import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Sidebar } from '../../shared/composants/sidebar/sidebar';
import { Header } from '../../shared/composants/header/header';
import { UserService } from '../../core/services/user-service';
import { ProfilUtilisateur, Utilisateur } from '../../core/modeles/utilisateurs.model';
import { ModalEnregistrementUser } from '../../shared/composants/modal-enregistrement-user/modal-enregistrement-user';
import { ModalEditUser } from '../../shared/composants/modal-edit-user/modal-edit-user';
import { ModalDeleteUser } from '../../shared/composants/modal-delete-user/modal-delete-user';
import { ModalViewProfile } from '../../shared/composants/modal-view-profile/modal-view-profile';

@Component({
  selector: 'app-gestion-comptes',
  standalone: true,
  imports: [CommonModule, Sidebar, Header, ModalEnregistrementUser, ModalEditUser, ModalDeleteUser, ModalViewProfile, FormsModule],
  templateUrl: './gestion-comptes.html',
  styleUrl: './gestion-comptes.scss'
})
export class GestionComptes implements OnInit {
  // Affichage paginé
  comptesAffiches: ProfilUtilisateur[] = [];

  // États des modales
  afficherChoixGlobal: boolean = false;
  afficherCreationCompte: boolean = false;
  afficherEditCompte: boolean = false;
  afficherDeleteCompte: boolean = false;
  afficherViewProfile: boolean = false;

  // Données éditées/supprimées
  profilEditer: ProfilUtilisateur | null = null;
  profilVoir: ProfilUtilisateur | null = null;
  userIdDelete: any = null;
  userNameDelete: string = '';
  titreViewProfil: string = "Profil Utilisateur";

  // Pagination
  pageActuelle: number = 1;
  readonly parPage: number = 5;          // Nombre d'éléments par page
  totalComptes: number = 0;              // Total après filtre

  // Recherche
  valeurSaisi: string = '';

  // Sources de données
  tousLesProfils: ProfilUtilisateur[] = [];     // Tous les profils depuis le backend
  resultatsFiltres: ProfilUtilisateur[] = [];   // Résultats après application du filtre (avant pagination)

  constructor(private utilisateursService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  // Chargement initial depuis l'API
  loadUsers(): void {
    this.utilisateursService.getProfils().subscribe({
      next: (data) => {
        this.tousLesProfils = data;
        this.resultatsFiltres = [...data];
        this.totalComptes = this.resultatsFiltres.length;
        this.pageActuelle = 1;
        this.appliquerPage();
      },
      error: (err) => console.error('Erreur chargement profils utilisateurs', err)
    });
  }

  // Filtrage en temps réel
  filtrerProfils(): void {
    if (!this.valeurSaisi.trim()) {
      this.resultatsFiltres = [...this.tousLesProfils];
    } else {
      const terme = this.valeurSaisi.toLowerCase().trim();
      this.resultatsFiltres = this.tousLesProfils.filter(profil =>
        profil.user.username?.toLowerCase().includes(terme) ||
        profil.user.email?.toLowerCase().includes(terme) ||
        profil.adresse?.toLowerCase().includes(terme) ||
        profil.user.phone?.includes(terme) ||
        profil.user.role?.toLowerCase().includes(terme)
      );
    }
    this.totalComptes = this.resultatsFiltres.length;
    this.pageActuelle = 1;   // Retour à la première page après filtrage
    this.appliquerPage();
  }

  // Appliquer la pagination sur les résultats filtrés
  private appliquerPage(): void {
    const debut = (this.pageActuelle - 1) * this.parPage;
    this.comptesAffiches = this.resultatsFiltres.slice(debut, debut + this.parPage);
  }

  // Calcul du nombre total de pages
  get totalPages(): number {
    return Math.ceil(this.totalComptes / this.parPage);
  }

  // Navigation
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

  // Gestion des actions utilisateur
  suspendreCompte(userId: string): void {
    const profil = this.tousLesProfils.find(p => p.user.id === userId);
    if (!profil) {
      console.error('Utilisateur non trouvé');
      return;
    }

    if (confirm(`Voulez-vous suspendre temporairement les accès de ${profil.user.username}?`)) {
      this.utilisateursService.suspendAccount(userId).subscribe({
        next: () => {
          alert(`Les droits d'accès de ${profil.user.username} ont été révoqués.`);
          this.loadUsers();  // recharge tout et réinitialise pagination/filtre
        },
        error: (err) => {
          console.error('Erreur suspension compte', err);
          alert('Erreur lors de la suspension du compte');
        }
      });
    }
  }

  activerCompte(userId: string): void {
    const profil = this.tousLesProfils.find(p => p.user.id === userId);
    if (!profil) {
      console.error('Utilisateur non trouvé');
      return;
    }

    this.utilisateursService.activateAccount(userId).subscribe({
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

  // Modales
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

  ouvrirEditCompte(profil: ProfilUtilisateur): void {
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

  ouvrirViewProfile(profil: ProfilUtilisateur): void {
    this.profilVoir = profil;
    this.afficherViewProfile = true;
  }

  fermerViewProfile(): void {
    this.afficherViewProfile = false;
    this.profilVoir = null;
  }

  ouvrirDeleteCompte(userId: any, userName: string): void {
    this.userIdDelete = userId;
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