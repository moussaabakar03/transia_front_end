import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Sidebar } from '../../../shared/composants/sidebar/sidebar';
import { Header } from '../../../shared/composants/header/header';
import { Ville } from '../../../shared/models/ville';
import { VilleService } from '../../../core/services/transport/ville-service';
import { CurrentUserService } from '../../../core/services/current-user.service';

@Component({
  selector: 'app-villes',
  standalone: true,
  imports: [CommonModule, Sidebar, Header, FormsModule],
  templateUrl: './villes.html',
  styleUrl: './villes.scss',
})
export class Villes implements OnInit {
  // Affichage paginé
  villesAffichees: Ville[] = [];

  // États des modales (ou formulaires d'action)
  afficherCreationVille: boolean = false;
  afficherEditVille: boolean = false;

  // Données éditées / en cours
  villeEditer: Ville | null = null;
  nouvelleVille: Ville = { id: '', nomVille: '', region: '', pays: 'Togo' };

  // Pagination
  pageActuelle: number = 1;
  readonly parPage: number = 5;          // Nombre d'éléments par page
  totalVilles: number = 0;               // Total après filtre

  // Recherche
  valeurSaisi: string = '';

  // Sources de données
  toutesLesVilles: Ville[] = [];        // Toutes les villes depuis le backend
  resultatsFiltres: Ville[] = [];       // Résultats après application du filtre (avant pagination)

  // Droits d'écriture (SUPER_ADMIN uniquement, cf. VilleController côté backend)
  peutGerer: boolean = false;

  constructor(
    private villeService: VilleService,
    private currentUser: CurrentUserService
  ) {}

  ngOnInit(): void {
    this.peutGerer = this.currentUser.peutGererVilles();
    this.loadVilles();
  }

  // Chargement initial depuis l'API
  loadVilles(): void {
    this.villeService.getAllVilles().subscribe({
      next: (data) => {
        this.toutesLesVilles = data;
        this.resultatsFiltres = [...data];
        this.totalVilles = this.resultatsFiltres.length;
        this.pageActuelle = 1;
        this.appliquerPage();
      },
      error: (err) => console.error('Erreur de chargement des villes', err)
    });
  }

  // Filtrage en temps réel par nom ou région
  filtrerVilles(): void {
    if (!this.valeurSaisi.trim()) {
      this.resultatsFiltres = [...this.toutesLesVilles];
    } else {
      const terme = this.valeurSaisi.toLowerCase().trim();
      this.resultatsFiltres = this.toutesLesVilles.filter(ville =>
        ville.nomVille.toLowerCase().includes(terme) ||
        ville.region.toLowerCase().includes(terme)
      );
    }
    this.totalVilles = this.resultatsFiltres.length;
    this.pageActuelle = 1; // Retour à la première page après filtrage
    this.appliquerPage();
  }

  // Appliquer la pagination sur les résultats filtrés
  private appliquerPage(): void {
    const debut = (this.pageActuelle - 1) * this.parPage;
    this.villesAffichees = this.resultatsFiltres.slice(debut, debut + this.parPage);
  }

  // Calcul du nombre total de pages
  get totalPages(): number {
    return Math.ceil(this.totalVilles / this.parPage);
  }

  // Navigation de pagination
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

  // Suppression d'une ville avec confirmation indigène
  supprimerVille(id: string | undefined, nom: string): void {
    if (!id) return;
    
    if (confirm(`Voulez-vous vraiment supprimer la ville de ${nom} ?`)) {
      this.villeService.deleteVille(id).subscribe({
        next: () => {
          alert(`La ville de ${nom} a été supprimée.`);
          this.loadVilles();
        },
        error: (err) => {
          console.error('Erreur lors de la suppression', err);
          alert('Impossible de supprimer cette ville.');
        }
      });
    }
  }

  // Actions de création
  ouvrirCreation(): void {
    this.nouvelleVille = { id: '', nomVille: '', region: '', pays: 'Togo' };
    this.afficherCreationVille = true;
  }

  soumettreCreation(): void {
    if (!this.nouvelleVille.nomVille || !this.nouvelleVille.region) {
      alert('Veuillez remplir tous les champs.');
      return;
    }
    this.villeService.createVille(this.nouvelleVille).subscribe({
      next: () => {
        this.afficherCreationVille = false;
        this.loadVilles();
      },
      error: (err) => console.error('Erreur lors de la création', err)
    });
  }

  // Actions d'édition
  ouvrirEdit(ville: Ville): void {
    this.villeEditer = { ...ville }; // Clone superficiel pour éviter l'édition directe en tableau
    this.afficherEditVille = true;
  }

  soumettreModification(): void {
    if (!this.villeEditer || !this.villeEditer.nomVille || !this.villeEditer.region) return;

    this.villeService.updateVille(this.villeEditer).subscribe({
      next: () => {
        this.afficherEditVille = false;
        this.villeEditer = null;
        this.loadVilles();
      },
      error: (err) => console.error('Erreur lors de la modification', err)
    });
  }
}