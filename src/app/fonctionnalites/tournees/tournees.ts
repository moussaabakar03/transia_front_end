import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Sidebar } from '../../shared/composants/sidebar/sidebar';
import { Header } from '../../shared/composants/header/header';
import { Tournee, TourneeRequest } from '../../shared/models/tournee.model';
import { DemandeCollecte, StatutCollecte } from '../../shared/models/demande-collecte.model';
import { TourneeService } from '../../core/services/tournee.service';
import { DemandeCollecteService } from '../../core/services/demande-collecte.service';
import { LivreurService } from '../../core/services/livreur.service';
import { UserResponse } from '../../shared/models/users';

interface FormErrors {
  dateTournee?: string;
  livreurId?: string;
}

enum ModalMode {
  AJOUT = 'ajout',
  MODIFICATION = 'modification',
  VISUALISATION = 'visualisation'
}

@Component({
  selector: 'app-tournees',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar, Header],
  templateUrl: './tournees.html',
  styleUrl: './tournees.scss',
})
export class TourneesComponent implements OnInit {
  readonly ModalMode = ModalMode;

  tournees: Tournee[] = [];
  filteredTournees: Tournee[] = [];
  availableDemandes: DemandeCollecte[] = [];
  livreurs: UserResponse[] = [];

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  paginatedTournees: Tournee[] = [];
  totalPages: number = 1;

  isLoading = true;
  errorMessage = '';
  searchTerm = '';
  selectedDate: string = '';
  selectedLivreur: string = '';

  // Modal
  isModalOpen = false;
  isSubmitting = false;
  formError = '';
  formSuccess = '';
  formErrors: FormErrors = {};
  modalMode: ModalMode = ModalMode.AJOUT;
  editingId: string | null = null;

  form: TourneeRequest = this.emptyForm();
  selectedDemandeIds: string[] = [];

  constructor(
    private tourneeService: TourneeService,
    private demandeService: DemandeCollecteService,
    private livreurService: LivreurService
  ) {}

  ngOnInit(): void {
    this.loadTournees();
    this.loadAvailableDemandes();
    this.loadLivreurs();
  }

  emptyForm(): TourneeRequest {
    return {
      dateTournee: '',
      livreurId: '',
      zone: '',
      demandeIds: []
    };
  }

  loadTournees(): void {
    this.isLoading = true;
    this.tourneeService.getAll().subscribe({
      next: (data) => {
        this.tournees = data;
        this.filteredTournees = data;
        this.applyPagination();
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Erreur lors du chargement des tournées';
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  loadAvailableDemandes(): void {
    this.demandeService.getAll().subscribe({
      next: (data) => {
        this.availableDemandes = data.filter(d => !d.tourneeId && d.statut !== StatutCollecte.ANNULE);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des demandes de collecte', err);
      }
    });
  }

  loadLivreurs(): void {
    this.livreurService.getLivreursDisponibles().subscribe({
      next: (data) => {
        this.livreurs = data;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des livreurs', err);
      }
    });
  }

  applyFilters(): void {
    this.filteredTournees = this.tournees.filter(tournee => {
      const matchesSearch = !this.searchTerm ||
        tournee.zone?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        tournee.livreur?.fullName?.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesDate = !this.selectedDate || tournee.dateTournee === this.selectedDate;
      const matchesLivreur = !this.selectedLivreur || tournee.livreurId === this.selectedLivreur;

      return matchesSearch && matchesDate && matchesLivreur;
    });

    this.currentPage = 1;
    this.applyPagination();
  }

  applyPagination(): void {
    this.totalPages = Math.ceil(this.filteredTournees.length / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedTournees = this.filteredTournees.slice(startIndex, endIndex);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.applyPagination();
    }
  }

  openModal(mode: ModalMode, tournee?: Tournee): void {
    this.modalMode = mode;
    this.isModalOpen = true;
    this.formError = '';
    this.formSuccess = '';
    this.formErrors = {};
    this.selectedDemandeIds = [];

    if (mode === ModalMode.MODIFICATION && tournee) {
      this.editingId = tournee.id || null;
      this.form = {
        dateTournee: tournee.dateTournee,
        livreurId: tournee.livreurId || '',
        zone: tournee.zone || '',
        demandeIds: tournee.demandesCollecte?.map(d => d.id!) || []
      };
      this.selectedDemandeIds = this.form.demandeIds || [];
    } else if (mode === ModalMode.VISUALISATION && tournee) {
      this.editingId = tournee.id || null;
      this.form = {
        dateTournee: tournee.dateTournee,
        livreurId: tournee.livreurId || '',
        zone: tournee.zone || '',
        demandeIds: []
      };
    } else {
      this.editingId = null;
      this.form = this.emptyForm();
    }
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.form = this.emptyForm();
    this.editingId = null;
    this.selectedDemandeIds = [];
  }

  validateForm(): boolean {
    this.formErrors = {};

    if (!this.form.dateTournee) {
      this.formErrors.dateTournee = 'La date de tournée est requise';
    }
    if (!this.form.livreurId) {
      this.formErrors.livreurId = 'Le livreur est requis';
    }

    return Object.keys(this.formErrors).length === 0;
  }

  submitForm(): void {
    if (!this.validateForm()) {
      return;
    }

    this.form.demandeIds = this.selectedDemandeIds;
    this.isSubmitting = true;
    this.formError = '';

    if (this.modalMode === ModalMode.AJOUT) {
      this.tourneeService.create(this.form).subscribe({
        next: () => {
          this.formSuccess = 'Tournée créée avec succès';
          this.isSubmitting = false;
          this.loadTournees();
          this.loadAvailableDemandes();
          setTimeout(() => this.closeModal(), 1500);
        },
        error: (err) => {
          this.formError = 'Erreur lors de la création de la tournée';
          this.isSubmitting = false;
          console.error(err);
        }
      });
    } else if (this.modalMode === ModalMode.MODIFICATION && this.editingId) {
      this.tourneeService.updatePartial(this.editingId, this.form).subscribe({
        next: () => {
          this.formSuccess = 'Tournée mise à jour avec succès';
          this.isSubmitting = false;
          this.loadTournees();
          setTimeout(() => this.closeModal(), 1500);
        },
        error: (err) => {
          this.formError = 'Erreur lors de la mise à jour de la tournée';
          this.isSubmitting = false;
          console.error(err);
        }
      });
    }
  }

  deleteTournee(tourneeId: string): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette tournée ?')) {
      this.tourneeService.delete(tourneeId).subscribe({
        next: () => {
          this.loadTournees();
          this.loadAvailableDemandes();
        },
        error: (err) => {
          console.error('Erreur lors de la suppression', err);
        }
      });
    }
  }

  removeDemandeFromTournee(tourneeId: string, demandeId: string): void {
    this.tourneeService.removeDemandeFromTournee(tourneeId, demandeId).subscribe({
      next: () => {
        this.loadTournees();
        this.loadAvailableDemandes();
      },
      error: (err) => {
        console.error('Erreur lors du retrait de la demande', err);
      }
    });
  }

  toggleDemandeSelection(demandeId: string): void {
    const index = this.selectedDemandeIds.indexOf(demandeId);
    if (index > -1) {
      this.selectedDemandeIds.splice(index, 1);
    } else {
      this.selectedDemandeIds.push(demandeId);
    }
  }

  isDemandeSelected(demandeId: string): boolean {
    return this.selectedDemandeIds.includes(demandeId);
  }

  getStatutClass(statut: string): string {
    switch (statut) {
      case 'PLANIFIEE':
        return 'status-planned';
      case 'EN_COURS':
        return 'status-in-progress';
      case 'TERMINEE':
        return 'status-completed';
      default:
        return '';
    }
  }

  formatDate(date: string): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR');
  }

  getLivreurName(livreurId: string): string {
    const livreur = this.livreurs.find(l => String(l.publicId) === livreurId);
    return livreur?.fullName || '';
  }

  getTourneeStatut(tourneeId: string): string {
    const tournee = this.tournees.find(t => t.id === tourneeId);
    return tournee?.statut || '-';
  }

  getTourneeDemandes(tourneeId: string): DemandeCollecte[] {
    const tournee = this.tournees.find(t => t.id === tourneeId);
    return tournee?.demandesCollecte || [];
  }

  hasTourneeDemandes(tourneeId: string): boolean {
    const tournee = this.tournees.find(t => t.id === tourneeId);
    return (tournee?.demandesCollecte?.length || 0) > 0;
  }
}
