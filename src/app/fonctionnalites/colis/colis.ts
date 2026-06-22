import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Sidebar } from '../../shared/composants/sidebar/sidebar';
import { Header } from '../../shared/composants/header/header';
import { Colis, ColisRequest, StatutColis, ModeDepot } from '../../shared/models/colis.model';
import { ColisService } from '../../core/services/colis.service';
import { LivreurService } from '../../core/services/livreur.service';
import { UserResponse } from '../../shared/models/users';

interface FormErrors {
  nomDestinataire?: string;
  adresseDestinataire?: string;
  telephoneDestinataire?: string;
  poids?: string;
  longueur?: string;
  largeur?: string;
  hauteur?: string;
}

enum ModalMode {
  AJOUT = 'ajout',
  MODIFICATION = 'modification',
  VISUALISATION = 'visualisation'
}

@Component({
  selector: 'app-colis',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar, Header],
  templateUrl: './colis.html',
  styleUrl: './colis.scss',
})
export class ColisComponent implements OnInit {
  // Make enums accessible in template
  readonly ModalMode = ModalMode;
  readonly StatutColis = StatutColis;
  readonly ModeDepot = ModeDepot;

  colisList: Colis[] = [];
  filteredColis: Colis[] = [];
  livreurs: UserResponse[] = [];

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  paginatedColis: Colis[] = [];
  totalPages: number = 1;

  isLoading = true;
  errorMessage = '';
  searchTerm = '';
  selectedStatut: StatutColis | '' = '';
  selectedLivreur: string = '';

  // Modal
  isModalOpen = false;
  isSubmitting = false;
  formError = '';
  formSuccess = '';
  formErrors: FormErrors = {};
  modalMode: ModalMode = ModalMode.AJOUT;
  editingId: string | null = null;

  form: ColisRequest = this.emptyForm();

  statutOptions = Object.values(StatutColis);
  modeDepotOptions = Object.values(ModeDepot);

  constructor(
    private colisService: ColisService,
    private livreurService: LivreurService
  ) {}

  ngOnInit(): void {
    this.loadColis();
    this.loadLivreurs();
  }

  emptyForm(): ColisRequest {
    return {
      nomDestinataire: '',
      adresseDestinataire: '',
      telephoneDestinataire: '',
      poids: 0,
      longueur: 0,
      largeur: 0,
      hauteur: 0,
      modeDepot: ModeDepot.DEPOT_AGENCE,
      remarques: ''
    };
  }

  loadColis(): void {
    this.isLoading = true;
    this.colisService.getAll().subscribe({
      next: (data) => {
        this.colisList = data;
        this.filteredColis = data;
        this.applyPagination();
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Erreur lors du chargement des colis';
        this.isLoading = false;
        console.error(err);
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
    this.filteredColis = this.colisList.filter(colis => {
      const matchesSearch = !this.searchTerm || 
        colis.nomDestinataire.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        colis.numeroSuivi?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        colis.adresseDestinataire.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesStatut = !this.selectedStatut || colis.statut === this.selectedStatut;
      const matchesLivreur = !this.selectedLivreur || colis.livreurId === this.selectedLivreur;

      return matchesSearch && matchesStatut && matchesLivreur;
    });

    this.currentPage = 1;
    this.applyPagination();
  }

  applyPagination(): void {
    this.totalPages = Math.ceil(this.filteredColis.length / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedColis = this.filteredColis.slice(startIndex, endIndex);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.applyPagination();
    }
  }

  openModal(mode: ModalMode, colis?: Colis): void {
    this.modalMode = mode;
    this.isModalOpen = true;
    this.formError = '';
    this.formSuccess = '';
    this.formErrors = {};

    if (mode === ModalMode.MODIFICATION && colis) {
      this.editingId = colis.id || null;
      this.form = {
        nomDestinataire: colis.nomDestinataire,
        adresseDestinataire: colis.adresseDestinataire,
        telephoneDestinataire: colis.telephoneDestinataire,
        poids: colis.poids,
        longueur: colis.longueur,
        largeur: colis.largeur,
        hauteur: colis.hauteur,
        modeDepot: colis.modeDepot,
        remarques: colis.remarques || '',
        adresseCollecte: colis.adresseCollecte,
        telephoneCollecte: colis.telephoneCollecte,
        dateHeureCollecteSouhaitee: colis.dateHeureCollecteSouhaitee,
        latitudeDestinataire: colis.latitudeDestinataire,
        longitudeDestinataire: colis.longitudeDestinataire,
        latitudeCollecte: colis.latitudeCollecte,
        longitudeCollecte: colis.longitudeCollecte
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
  }

  validateForm(): boolean {
    this.formErrors = {};

    if (!this.form.nomDestinataire.trim()) {
      this.formErrors.nomDestinataire = 'Le nom du destinataire est requis';
    }
    if (!this.form.adresseDestinataire.trim()) {
      this.formErrors.adresseDestinataire = 'L\'adresse du destinataire est requise';
    }
    if (!this.form.telephoneDestinataire.trim()) {
      this.formErrors.telephoneDestinataire = 'Le téléphone du destinataire est requis';
    }
    if (!this.form.poids || this.form.poids <= 0) {
      this.formErrors.poids = 'Le poids doit être supérieur à 0';
    }
    if (!this.form.longueur || this.form.longueur <= 0) {
      this.formErrors.longueur = 'La longueur doit être supérieure à 0';
    }
    if (!this.form.largeur || this.form.largeur <= 0) {
      this.formErrors.largeur = 'La largeur doit être supérieure à 0';
    }
    if (!this.form.hauteur || this.form.hauteur <= 0) {
      this.formErrors.hauteur = 'La hauteur doit être supérieure à 0';
    }

    if (this.form.modeDepot === ModeDepot.ENLEVEMENT_DOMICILE) {
      if (!this.form.adresseCollecte?.trim()) {
        this.formErrors.adresseDestinataire = 'L\'adresse de collecte est requise pour l\'enlèvement à domicile';
      }
      if (!this.form.telephoneCollecte?.trim()) {
        this.formErrors.telephoneDestinataire = 'Le téléphone de collecte est requis pour l\'enlèvement à domicile';
      }
    }

    return Object.keys(this.formErrors).length === 0;
  }

  submitForm(): void {
    if (!this.validateForm()) {
      return;
    }

    this.isSubmitting = true;
    this.formError = '';

    if (this.modalMode === ModalMode.AJOUT) {
      this.colisService.create(this.form).subscribe({
        next: () => {
          this.formSuccess = 'Colis créé avec succès';
          this.isSubmitting = false;
          this.loadColis();
          setTimeout(() => this.closeModal(), 1500);
        },
        error: (err) => {
          this.formError = 'Erreur lors de la création du colis';
          this.isSubmitting = false;
          console.error(err);
        }
      });
    } else if (this.modalMode === ModalMode.MODIFICATION && this.editingId) {
      this.colisService.updatePartial(this.editingId, this.form).subscribe({
        next: () => {
          this.formSuccess = 'Colis mis à jour avec succès';
          this.isSubmitting = false;
          this.loadColis();
          setTimeout(() => this.closeModal(), 1500);
        },
        error: (err) => {
          this.formError = 'Erreur lors de la mise à jour du colis';
          this.isSubmitting = false;
          console.error(err);
        }
      });
    }
  }

  assignerLivreur(colisId: string, livreurId: string): void {
    this.colisService.assignerLivreur(colisId, livreurId).subscribe({
      next: () => {
        this.loadColis();
      },
      error: (err) => {
        console.error('Erreur lors de l\'assignation du livreur', err);
      }
    });
  }

  assignerLivreurWithId(colisId: string, livreurId: number | string | undefined): void {
    if (livreurId) {
      this.assignerLivreur(colisId, String(livreurId));
    }
  }

  getLivreurFullName(livreurId: string): string {
    const livreur = this.livreurs.find(l => String(l.id) === livreurId);
    return livreur?.fullName || '';
  }

  getDefaultLivreurId(): string {
    return String(this.livreurs[0]?.id || '');
  }

  collecter(colisId: string): void {
    const commentaire = prompt('Commentaire (optionnel) :');
    this.colisService.collecter(colisId, commentaire || undefined).subscribe({
      next: () => {
        this.loadColis();
      },
      error: (err) => {
        console.error('Erreur lors de la collecte', err);
      }
    });
  }

  livrer(colisId: string): void {
    const commentaire = prompt('Commentaire (optionnel) :');
    this.colisService.livrer(colisId, commentaire || undefined).subscribe({
      next: () => {
        this.loadColis();
      },
      error: (err) => {
        console.error('Erreur lors de la livraison', err);
      }
    });
  }

  annuler(colisId: string): void {
    if (confirm('Êtes-vous sûr de vouloir annuler ce colis ?')) {
      this.colisService.annuler(colisId).subscribe({
        next: () => {
          this.loadColis();
        },
        error: (err) => {
          console.error('Erreur lors de l\'annulation', err);
        }
      });
    }
  }

  getStatutClass(statut: StatutColis): string {
    switch (statut) {
      case StatutColis.EN_ATTENTE_COLLECTE:
        return 'status-pending';
      case StatutColis.PRIS_EN_CHARGE:
        return 'status-in-progress';
      case StatutColis.COLLECTE_EFFECTUEE:
        return 'status-collected';
      case StatutColis.EN_COURS:
        return 'status-in-transit';
      case StatutColis.LIVRE:
        return 'status-delivered';
      case StatutColis.ANNULE:
        return 'status-cancelled';
      default:
        return '';
    }
  }

  getStatutLabel(statut: StatutColis): string {
    switch (statut) {
      case StatutColis.EN_ATTENTE_COLLECTE:
        return 'En attente de collecte';
      case StatutColis.PRIS_EN_CHARGE:
        return 'Pris en charge';
      case StatutColis.COLLECTE_EFFECTUEE:
        return 'Collecté';
      case StatutColis.EN_COURS:
        return 'En cours de livraison';
      case StatutColis.LIVRE:
        return 'Livré';
      case StatutColis.ANNULE:
        return 'Annulé';
      default:
        return statut;
    }
  }

  getModeDepotLabel(mode: ModeDepot): string {
    switch (mode) {
      case ModeDepot.ENLEVEMENT_DOMICILE:
        return 'Enlèvement à domicile';
      case ModeDepot.DEPOT_AGENCE:
        return 'Dépôt en agence';
      case ModeDepot.CREATION_AGENCE:
        return 'Création par agent';
      default:
        return mode;
    }
  }
}
