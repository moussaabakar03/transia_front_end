import { Component, OnInit, Output, EventEmitter, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router'; 
import { AuthService } from '../../../core/services/auth.service'; 
import { UserService } from '../../../core/services/user-service';
import { ModalViewProfile } from "../modal-view-profile/modal-view-profile";
import { ProfilComplet, UserResponse } from '../../models/users';


@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, ModalViewProfile], 
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header implements OnInit {

  @Output() actionCreer = new EventEmitter<void>();

  Utilisateur = {
    nom: "",
    role: "",
    username:""
  }
  user = this.Utilisateur;
  userName: string = 'Utilisateur'; 
  userRole: string = ''; 
  userAvatar: string | null = null; 
  showDropdown: boolean = false;    
  utilisateurConnecte: UserResponse = {} as UserResponse;
  profilUtilisateurConnecte: ProfilComplet = {} as ProfilComplet;
  
  afficherViewProfile: boolean = false;
  profilVoir: ProfilComplet | null = null;
  titreViewProfil: string = "Mon Profil";

  // ── États d'affichage des modales de création ─────────────────────────────
  afficherChoixProjet: boolean = false; // Gère la modale de sélection de méthode
  afficherCreationManuelle: boolean = false; // Gère la modale de création classique
  afficherImportExcel: boolean = false; // Gère ta nouvelle modale d'importation

  constructor(private authService: AuthService, private userService: UserService, private router: Router, private elementRef: ElementRef) {}

  ngOnInit(): void {
    // console.log(localStorage);
    this.userRole = localStorage.getItem('userRole') || '';

    this.user = this.authService.getCurrentUser();
    // this.userName = this.user? this.user.nom || user.first_name || 'Utilisateur';

    // console.log("utilisateur connecté: ", this.authService.getCurrentUser());
    // this.userService.fetchCurrentUser().subscribe({
    //   next: (user: Utilisateur) => {
    //     this.utilisateurConnecte = user;
    //     this.userName = user.username || user.first_name || 'Utilisateur';
    //   },
    //   error: (err) => console.error('Erreur chargement utilisateur', err)
    // });


    // this.userService.getMyProfil().subscribe({
    //   next: (profil) => {
    //     this.profilUtilisateurConnecte = profil;
    //     if (this.profilUtilisateurConnecte.user.last_name){
    //       this.titreViewProfil = "Mon Profil "+ this.profilUtilisateurConnecte.user.last_name;
    //     }
    //     this.userAvatar = profil.photo_profil;
    //   },
    //   error: (err) => console.error('Erreur chargement profil', err)
    // });
  }

  // ── Gestion du flux de création (Suivi strict du schéma) ───────────────────
  
  /**
   * Clic sur le bouton principal du Header
   */
  declencherCreation(): void {
    this.afficherChoixProjet = true; // Étape 1 : On ouvre d'abord la boîte de choix
  }

  /**
   * Choix 1 : L'utilisateur veut concevoir à la main
   */
  ouvrirCreationManuelle(): void {
    this.afficherChoixProjet = false; // Ferme le choix
    this.afficherCreationManuelle = true; // Ouvre la modale drag & drop classique
  }

  /**
   * Choix 2 : L'utilisateur veut importer depuis un fichier Excel
   */
  ouvrirImportExcel(): void {
    this.afficherChoixProjet = false; // Ferme le choix
    this.afficherImportExcel = true; // Ouvre notre nouvelle modale d'import Excel !
  }

  /**
   * Déclenché quand l'importation ou la création manuelle réussit
   */
  rafraichirDashboard(): void {
    // Petit message sympa avant de recharger la vue
    window.location.reload(); 
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }

  logout(): void {
    this.authService.logout(); 
    alert('Session clôturée avec succès.');
    this.router.navigate(['/login']);
  }

  ouvrirViewProfile(): void {
    this.profilVoir = this.profilUtilisateurConnecte;
    this.afficherViewProfile = true;
  }

  fermerViewProfile(): void {
    this.afficherViewProfile = false;
    this.profilVoir = null;
  }

  // 3. Ajoute cette méthode n'importe où dans ton composant :
  @HostListener('document:click', ['$event'])
  closeDropdownOnOutsideClick(event: MouseEvent): void {
    // Si le dropdown est ouvert et que le clic a lieu en dehors du composant header, on ferme.
    if (this.showDropdown && !this.elementRef.nativeElement.contains(event.target)) {
      this.showDropdown = false;
    }
  }
}