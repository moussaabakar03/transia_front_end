import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Sidebar } from '../../shared/composants/sidebar/sidebar';
import { Header } from '../../shared/composants/header/header';
import { Tournee, TourneeRequest } from '../../shared/models/tournee.model';
import { Colis, StatutColis } from '../../shared/models/colis.model';
import { TourneeService } from '../../core/services/tournee.service';
import { ColisService } from '../../core/services/colis.service';
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
  // Make enum accessible in template
  readonly ModalMode = ModalMode;

  tournees: Tournee[] = [];
  filteredTournees: Tournee[] = [];
  availableColis: Colis[] = [];
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
  selectedColisIds: string[] = [];

  constructor(
    private tourneeService: TourneeService,
    private colisService: ColisService,
    private livreurService: LivreurService
  ) {}

  ngOnInit(): void {
    this.loadTournees();
    this.loadAvailableColis();
    this.loadLivreurs();
  }

  emptyForm(): TourneeRequest {
    return {
      dateTournee: '',
      livreurId: '',
      zone: '',
      colisIds: []
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

  loadAvailableColis(): void {
    this.colisService.getAll({ statut: StatutColis.PRIS_EN_CHARGE }).subscribe({
      next: (data) => {
        this.availableColis = data.filter(colis => !colis.tourneeId);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des colis disponibles', err);
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
        tournee.livreur?.username?.toLowerCase().includes(this.searchTerm.toLowerCase());
      
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
    this.selectedColisIds = [];

    if (mode === ModalMode.MODIFICATION && tournee) {
      this.editingId = tournee.id || null;
      this.form = {
        dateTournee: tournee.dateTournee,
        livreurId: tournee.livreurId || '',
        zone: tournee.zone || '',
        colisIds: tournee.colis?.map(c => c.id!) || []
      };
      this.selectedColisIds = this.form.colisIds || [];
    } else {
      this.editingId = null;
      this.form = this.emptyForm();
    }
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.form = this.emptyForm();
    this.editingId = null;
    this.selectedColisIds = [];
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

    this.form.colisIds = this.selectedColisIds;
    this.isSubmitting = true;
    this.formError = '';

    if (this.modalMode === ModalMode.AJOUT) {
      this.tourneeService.create(this.form).subscribe({
        next: () => {
          this.formSuccess = 'Tournée créée avec succès';
          this.isSubmitting = false;
          this.loadTournees();
          this.loadAvailableColis();
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
          this.loadAvailableColis();
        },
        error: (err) => {
          console.error('Erreur lors de la suppression', err);
        }
      });
    }
  }

  removeColisFromTournee(tourneeId: string, colisId: string): void {
    this.tourneeService.removeColisFromTournee(tourneeId, colisId).subscribe({
      next: () => {
        this.loadTournees();
        this.loadAvailableColis();
      },
      error: (err) => {
        console.error('Erreur lors du retrait du colis', err);
      }
    });
  }

  toggleColisSelection(colisId: string): void {
    const index = this.selectedColisIds.indexOf(colisId);
    if (index > -1) {
      this.selectedColisIds.splice(index, 1);
    } else {
      this.selectedColisIds.push(colisId);
    }
  }

  isColisSelected(colisId: string): boolean {
    return this.selectedColisIds.includes(colisId);
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
    const livreur = this.livreurs.find(l => String(l.id) === livreurId);
    return livreur?.fullName || '';
  }

  getTourneeStatut(tourneeId: string): string {
    const tournee = this.tournees.find(t => t.id === tourneeId);
    return tournee?.statut || '-';
  }

  getTourneeColis(tourneeId: string): any[] {
    const tournee = this.tournees.find(t => t.id === tourneeId);
    return tournee?.colis || [];
  }

  hasTourneeColis(tourneeId: string): boolean {
    const tournee = this.tournees.find(t => t.id === tourneeId);
    return (tournee?.colis?.length || 0) > 0;
  }
}
