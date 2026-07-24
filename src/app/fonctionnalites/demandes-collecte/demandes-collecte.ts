import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Sidebar } from '../../shared/composants/sidebar/sidebar';
import { Header } from '../../shared/composants/header/header';
import { DemandeCollecte, StatutCollecte } from '../../shared/models/demande-collecte.model';
import { UserResponse } from '../../shared/models/users';
import { DemandeCollecteService } from '../../core/services/demande-collecte.service';
import { LivreurService } from '../../core/services/livreur.service';

@Component({
  selector: 'app-demandes-collecte',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar, Header],
  templateUrl: './demandes-collecte.html',
  styleUrl: './demandes-collecte.scss',
})
export class DemandesCollecteComponent implements OnInit {
  readonly StatutCollecte = StatutCollecte;

  demandes: DemandeCollecte[] = [];
  filteredDemandes: DemandeCollecte[] = [];
  livreurs: UserResponse[] = [];

  isLoading = true;
  errorMessage = '';
  searchTerm = '';
  selectedStatut: StatutCollecte | '' = '';

  isModalOpen = false;
  isSubmitting = false;
  formError = '';
  selectedDemande: DemandeCollecte | null = null;
  selectedLivreurId = '';

  constructor(
    private demandeService: DemandeCollecteService,
    private livreurService: LivreurService,
  ) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.isLoading = true;
    forkJoin({
      demandes: this.demandeService.getAll(),
      livreurs: this.livreurService.getLivreursDisponibles(),
    }).subscribe({
      next: (r) => {
        this.demandes = r.demandes || [];
        this.livreurs = r.livreurs || [];
        this.applyFilters();
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Erreur lors du chargement des demandes de collecte.';
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredDemandes = this.demandes.filter(d => {
      const matchSearch = !term ||
        d.expediteurNom?.toLowerCase().includes(term) ||
        d.adresseCollecte?.toLowerCase().includes(term);
      const matchStatut = !this.selectedStatut || d.statut === this.selectedStatut;
      return matchSearch && matchStatut;
    });
  }

  openAssigner(d: DemandeCollecte): void {
    this.selectedDemande = d;
    this.selectedLivreurId = d.livreurId || '';
    this.formError = '';
    this.isModalOpen = true;
  }

  closeModal(): void {
    if (this.isSubmitting) return;
    this.isModalOpen = false;
    this.selectedDemande = null;
  }

  submitAssigner(): void {
    if (!this.selectedDemande?.id || !this.selectedLivreurId) return;
    this.isSubmitting = true;
    this.demandeService.assignerLivreur(this.selectedDemande.id, this.selectedLivreurId).subscribe({
      next: (u) => {
        this.isSubmitting = false;
        const i = this.demandes.findIndex(x => x.id === u.id);
        if (i !== -1) this.demandes[i] = u;
        this.applyFilters();
        this.closeModal();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.formError = err.error?.message || 'Erreur lors de l\'assignation.';
      }
    });
  }

  annuler(d: DemandeCollecte): void {
    if (!d.id || !confirm('Annuler cette demande de collecte ?')) return;
    this.demandeService.annuler(d.id).subscribe({
      next: (u) => {
        const i = this.demandes.findIndex(x => x.id === u.id);
        if (i !== -1) this.demandes[i] = u;
        this.applyFilters();
      },
      error: (err) => alert(err.error?.message || 'Erreur lors de l\'annulation.')
    });
  }

  canAssign(d: DemandeCollecte): boolean { return d.statut === StatutCollecte.EN_ATTENTE; }
  canCancel(d: DemandeCollecte): boolean { return d.statut === StatutCollecte.EN_ATTENTE || d.statut === StatutCollecte.EN_COURS; }

  getStatutConfig(s: StatutCollecte): { label: string; css: string } {
    const map: Record<StatutCollecte, { label: string; css: string }> = {
      [StatutCollecte.EN_ATTENTE]: { label: 'En attente', css: 'st-attente' },
      [StatutCollecte.EN_COURS]:   { label: 'Livreur assigné', css: 'st-charge' },
      [StatutCollecte.COLLECTE]:   { label: 'Collectée', css: 'st-livre' },
      [StatutCollecte.ANNULE]:     { label: 'Annulée', css: 'st-annule' },
    };
    return map[s] || { label: s, css: '' };
  }

  formatDate(date?: string): string {
    if (!date) return '—';
    return new Date(date).toLocaleString('fr-FR');
  }
}
