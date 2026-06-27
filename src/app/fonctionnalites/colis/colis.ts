import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Sidebar } from '../../shared/composants/sidebar/sidebar';
import { Header } from '../../shared/composants/header/header';
import { Colis, ColisRequest, StatutColis, ModeDepot, ModeRemise } from '../../shared/models/colis.model';
import { Ville } from '../../shared/models/ville';
import { Trajet } from '../../shared/models/trajet';
import { UserResponse } from '../../shared/models/users';
import { ColisService } from '../../core/services/colis.service';
import { LivreurService } from '../../core/services/livreur.service';
import { VilleService } from '../../core/services/transport/ville-service';
import { TrajetService } from '../../core/services/transport/trajet-service';
import { CurrentUserService } from '../../core/services/current-user.service';

interface ColisForm {
  nomDestinataire: string;
  adresseDestinataire: string;
  telephoneDestinataire: string;
  poids: number;
  longueur: number;
  largeur: number;
  hauteur: number;
  remarques: string;
  modeDepot: ModeDepot;
  modeRemise: ModeRemise | '';
  adresseCollecte: string;
  telephoneCollecte: string;
  villeDepartId: string;
  villeArriveeId: string;
  trajetId: string;
}

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
  VISUALISATION = 'visualisation',
  ASSIGNER = 'assigner'
}

@Component({
  selector: 'app-colis',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar, Header],
  templateUrl: './colis.html',
  styleUrl: './colis.scss',
})
export class ColisComponent implements OnInit {
  readonly ModalMode = ModalMode;
  readonly StatutColis = StatutColis;
  readonly ModeDepot = ModeDepot;
  readonly ModeRemise = ModeRemise;

  colisList: Colis[] = [];
  filteredColis: Colis[] = [];
  villes: Ville[] = [];
  trajets: Trajet[] = [];
  livreurs: UserResponse[] = [];
  trajetsFiltres: Trajet[] = [];

  // Pagination
  currentPage = 1;
  itemsPerPage = 8;
  paginatedColis: Colis[] = [];
  totalPages = 1;

  isLoading = true;
  errorMessage = '';
  searchTerm = '';
  selectedStatut: StatutColis | '' = '';

  // Contexte agent connecté
  agentVilleId:  string | null = null;
  agentVilleNom  = '';
  isAdmin        = false;

  // Modal
  isModalOpen = false;
  isSubmitting = false;
  formError = '';
  formSuccess = '';
  formErrors: FormErrors = {};
  modalMode: ModalMode = ModalMode.AJOUT;
  editingId: string | null = null;
  selectedColis: Colis | null = null;
  selectedLivreurId = '';

  form: ColisForm = this.emptyForm();

  constructor(
    private colisService:  ColisService,
    private livreurService: LivreurService,
    private villeService:  VilleService,
    private trajetService: TrajetService,
    private cd:            ChangeDetectorRef,
    private currentUser:   CurrentUserService
  ) {}

  ngOnInit(): void {
    this.agentVilleId  = this.currentUser.getVilleId();
    this.agentVilleNom = this.currentUser.getVilleNom() ?? '';
    this.isAdmin       = this.currentUser.isGlobalView();
    this.loadAll();
  }

  loadAll(): void {
    this.isLoading = true;
    forkJoin({
      colis: this.colisService.getAll(),
      villes: this.villeService.getAllVilles(),
      trajets: this.trajetService.getAll(),
      livreurs: this.livreurService.getLivreurs()
    }).subscribe({
      next: r => {
        this.colisList = r.colis || [];
        this.villes    = r.villes || [];
        this.trajets   = r.trajets || [];
        this.livreurs  = r.livreurs || [];
        this.applyFilters();
        this.isLoading = false;
        this.cd.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Erreur lors du chargement.';
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredColis = this.colisList.filter(c => {
      const matchSearch = !term ||
        c.nomDestinataire.toLowerCase().includes(term) ||
        c.numeroSuivi?.toLowerCase().includes(term) ||
        c.villeDepartNom?.toLowerCase().includes(term) ||
        c.villeArriveeNom?.toLowerCase().includes(term);
      const matchStatut = !this.selectedStatut || c.statut === this.selectedStatut;
      return matchSearch && matchStatut;
    });
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredColis.length / this.itemsPerPage) || 1;
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedColis = this.filteredColis.slice(start, start + this.itemsPerPage);
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePagination();
  }

  getPaginationPages(): number[] {
    const pages: number[] = [];
    const max = 5;
    if (this.totalPages <= max) {
      for (let i = 1; i <= this.totalPages; i++) pages.push(i);
    } else {
      const start = Math.max(1, this.currentPage - 2);
      const end   = Math.min(this.totalPages, start + max - 1);
      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  }

  onVilleDepartChange(): void {
    this.form.villeArriveeId = '';
    this.form.trajetId = '';
    this.trajetsFiltres = [];
  }

  onVilleArriveeChange(): void {
    this.form.trajetId = '';
    if (this.form.villeDepartId && this.form.villeArriveeId) {
      this.trajetsFiltres = this.trajets.filter(t =>
        t.villeDepart?.id === this.form.villeDepartId &&
        t.villeArrivee?.id === this.form.villeArriveeId
      );
    }
  }

  openCreate(): void {
    this.modalMode = ModalMode.AJOUT;
    this.editingId = null;
    this.form = this.emptyForm();
    // Pré-remplir la ville de départ avec la ville de l'agent
    if (this.agentVilleId) {
      this.form.villeDepartId = this.agentVilleId;
      this.onVilleDepartChange();
    }
    this.trajetsFiltres = [];
    this.openModalCommon();
  }

  openView(c: Colis): void {
    this.modalMode = ModalMode.VISUALISATION;
    this.selectedColis = c;
    this.openModalCommon();
  }

  openEdit(c: Colis): void {
    this.modalMode = ModalMode.MODIFICATION;
    this.editingId = c.id || null;
    this.form = {
      nomDestinataire:       c.nomDestinataire,
      adresseDestinataire:   c.adresseDestinataire,
      telephoneDestinataire: c.telephoneDestinataire,
      poids:                 c.poids,
      longueur:              c.longueur,
      largeur:               c.largeur,
      hauteur:               c.hauteur,
      remarques:             c.remarques || '',
      modeDepot:             c.modeDepot,
      modeRemise:            c.modeRemise || '',
      adresseCollecte:       c.adresseCollecte || '',
      telephoneCollecte:     c.telephoneCollecte || '',
      villeDepartId:         c.villeDepartId || '',
      villeArriveeId:        c.villeArriveeId || '',
      trajetId:              c.trajetId || '',
    };
    if (c.villeDepartId && c.villeArriveeId) {
      this.trajetsFiltres = this.trajets.filter(t =>
        t.villeDepart?.id === c.villeDepartId &&
        t.villeArrivee?.id === c.villeArriveeId
      );
    }
    this.openModalCommon();
  }

  openAssigner(c: Colis): void {
    this.modalMode = ModalMode.ASSIGNER;
    this.selectedColis = c;
    this.selectedLivreurId = c.livreurId || '';
    this.openModalCommon();
  }

  private openModalCommon(): void {
    this.formError = ''; this.formSuccess = ''; this.formErrors = {};
    this.isModalOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeModal(): void {
    if (this.isSubmitting) return;
    this.isModalOpen = false;
    this.selectedColis = null;
    document.body.style.overflow = '';
  }

  @HostListener('document:keydown.escape')
  onEscape(): void { if (this.isModalOpen) this.closeModal(); }

  validateForm(): boolean {
    this.formErrors = {};
    if (!this.form.nomDestinataire.trim())       this.formErrors.nomDestinataire       = 'Champ obligatoire';
    if (!this.form.adresseDestinataire.trim())   this.formErrors.adresseDestinataire   = 'Champ obligatoire';
    if (!this.form.telephoneDestinataire.trim()) this.formErrors.telephoneDestinataire = 'Champ obligatoire';
    if (!this.form.poids || this.form.poids <= 0)     this.formErrors.poids    = 'Poids requis (> 0)';
    if (!this.form.longueur || this.form.longueur <= 0) this.formErrors.longueur = 'Longueur requise';
    if (!this.form.largeur || this.form.largeur <= 0)   this.formErrors.largeur  = 'Largeur requise';
    if (!this.form.hauteur || this.form.hauteur <= 0)   this.formErrors.hauteur  = 'Hauteur requise';
    return Object.keys(this.formErrors).length === 0;
  }

  submitForm(): void {
    if (!this.validateForm()) return;
    this.isSubmitting = true;
    this.formError = '';

    const payload: ColisRequest = {
      nomDestinataire:       this.form.nomDestinataire.trim(),
      adresseDestinataire:   this.form.adresseDestinataire.trim(),
      telephoneDestinataire: this.form.telephoneDestinataire.trim(),
      poids:                 this.form.poids,
      longueur:              this.form.longueur,
      largeur:               this.form.largeur,
      hauteur:               this.form.hauteur,
      remarques:             this.form.remarques.trim() || undefined,
      modeDepot:             this.form.modeDepot,
      modeRemise:            this.form.modeRemise as ModeRemise || undefined,
      adresseCollecte:       this.form.adresseCollecte || undefined,
      telephoneCollecte:     this.form.telephoneCollecte || undefined,
      villeDepartId:         this.form.villeDepartId || undefined,
      villeArriveeId:        this.form.villeArriveeId || undefined,
      trajetId:              this.form.trajetId || undefined,
    };

    if (this.modalMode === ModalMode.AJOUT) {
      this.colisService.create(payload).subscribe({
        next: (n) => { this.isSubmitting = false; this.formSuccess = 'Colis créé avec succès.'; this.colisList.unshift(n); this.applyFilters(); setTimeout(() => this.closeModal(), 1500); },
        error: (err) => { this.isSubmitting = false; this.formError = err.error?.message || 'Erreur lors de la création.'; }
      });
    } else if (this.editingId) {
      this.colisService.updatePartial(this.editingId, payload).subscribe({
        next: (u) => { this.isSubmitting = false; this.formSuccess = 'Colis mis à jour.'; const i = this.colisList.findIndex(c => c.id === this.editingId); if (i !== -1) this.colisList[i] = u; this.applyFilters(); setTimeout(() => this.closeModal(), 1500); },
        error: (err) => { this.isSubmitting = false; this.formError = err.error?.message || 'Erreur lors de la mise à jour.'; }
      });
    }
  }

  submitAssigner(): void {
    if (!this.selectedColis?.id || !this.selectedLivreurId) return;
    this.isSubmitting = true;
    this.colisService.assignerLivreur(this.selectedColis.id, this.selectedLivreurId).subscribe({
      next: (u) => { this.isSubmitting = false; const i = this.colisList.findIndex(c => c.id === u.id); if (i !== -1) this.colisList[i] = u; this.applyFilters(); this.closeModal(); },
      error: () => { this.isSubmitting = false; this.formError = 'Erreur lors de l\'assignation.'; }
    });
  }

  collecter(c: Colis): void {
    if (!c.id) return;
    this.colisService.collecter(c.id).subscribe({
      next: (u) => { const i = this.colisList.findIndex(x => x.id === u.id); if (i !== -1) this.colisList[i] = u; this.applyFilters(); },
      error: (err) => alert(err.error?.message || 'Erreur collecte.')
    });
  }

  livrer(c: Colis): void {
    if (!c.id) return;
    this.colisService.livrer(c.id).subscribe({
      next: (u) => { const i = this.colisList.findIndex(x => x.id === u.id); if (i !== -1) this.colisList[i] = u; this.applyFilters(); },
      error: (err) => alert(err.error?.message || 'Erreur livraison.')
    });
  }

  annuler(c: Colis): void {
    if (!c.id || !confirm('Annuler ce colis ?')) return;
    this.colisService.annuler(c.id).subscribe({
      next: () => { const i = this.colisList.findIndex(x => x.id === c.id); if (i !== -1) this.colisList[i].statut = StatutColis.ANNULE; this.applyFilters(); },
      error: (err) => alert(err.error?.message || 'Erreur annulation.')
    });
  }

  getTrajetLabel(t: Trajet): string {
    return `${t.villeDepart?.nomVille || '?'} → ${t.villeArrivee?.nomVille || '?'} · ${t.dateDepart} ${t.heureDepart}`;
  }

  getStatutConfig(s: StatutColis): { label: string; css: string } {
    const map: Record<StatutColis, { label: string; css: string }> = {
      [StatutColis.EN_ATTENTE_COLLECTE]: { label: 'En attente',    css: 'st-attente'   },
      [StatutColis.PRIS_EN_CHARGE]:      { label: 'Pris en charge', css: 'st-charge'    },
      [StatutColis.COLLECTE_EFFECTUEE]:  { label: 'Collecté',       css: 'st-collecte'  },
      [StatutColis.EN_COURS]:            { label: 'En transit',      css: 'st-transit'   },
      [StatutColis.LIVRE]:               { label: 'Livré',           css: 'st-livre'     },
      [StatutColis.ANNULE]:              { label: 'Annulé',          css: 'st-annule'    },
    };
    return map[s] || { label: s, css: '' };
  }

  getModeDepotLabel(m: ModeDepot): string {
    const map: Record<ModeDepot, string> = {
      [ModeDepot.ENLEVEMENT_DOMICILE]: 'Enlèvement domicile',
      [ModeDepot.DEPOT_AGENCE]:        'Dépôt agence',
      [ModeDepot.CREATION_AGENCE]:     'Création agent',
    };
    return map[m] || m;
  }

  getModeRemiseLabel(m: ModeRemise | string | undefined): string {
    if (!m) return '—';
    const map: Record<string, string> = {
      LIVRAISON_DOMICILE: 'Livraison domicile',
      RETRAIT_AGENCE:     'Retrait agence',
    };
    return map[m] || m;
  }

  canEdit(c: Colis): boolean    { return c.statut === StatutColis.EN_ATTENTE_COLLECTE; }
  canAssign(c: Colis): boolean  { return c.statut === StatutColis.EN_ATTENTE_COLLECTE; }
  canCollect(c: Colis): boolean { return c.statut === StatutColis.PRIS_EN_CHARGE; }
  canDeliver(c: Colis): boolean { return c.statut === StatutColis.COLLECTE_EFFECTUEE || c.statut === StatutColis.EN_COURS; }
  canCancel(c: Colis): boolean  { return c.statut !== StatutColis.LIVRE && c.statut !== StatutColis.ANNULE; }

  getQrUrl(data: string): string {
    return 'https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=' + encodeURIComponent(data);
  }

  private emptyForm(): ColisForm {
    return {
      nomDestinataire: '', adresseDestinataire: '', telephoneDestinataire: '',
      poids: 0, longueur: 0, largeur: 0, hauteur: 0, remarques: '',
      modeDepot: ModeDepot.DEPOT_AGENCE, modeRemise: '',
      adresseCollecte: '', telephoneCollecte: '',
      villeDepartId: '', villeArriveeId: '', trajetId: ''
    };
  }
}