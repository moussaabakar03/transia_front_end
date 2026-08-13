import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Sidebar } from '../../shared/composants/sidebar/sidebar';
import { Header } from '../../shared/composants/header/header';
import {
  Colis, ColisRequest, StatutColis, StatutPaiementColis, TranchePoids, ModeRemise
} from '../../shared/models/colis.model';
import { EstimationPrix } from '../../shared/models/tarif-expedition.model';
import { Agence } from '../../shared/models/agence.model';
import { Trajet, StatutTrajet } from '../../shared/models/trajet';
import { UserResponse } from '../../shared/models/users';
import { ColisService } from '../../core/services/colis.service';
import { TarifExpeditionService } from '../../core/services/tarif-expedition.service';
import { LivreurService } from '../../core/services/livreur.service';
import { AgenceService } from '../../core/services/agence.service';
import { TrajetService } from '../../core/services/transport/trajet-service';
import { CurrentUserService } from '../../core/services/current-user.service';

interface ColisForm {
  description: string;
  tranchePoids: TranchePoids;
  dimensions: string;
  modeRemise: ModeRemise;
  expediteurNom: string;
  expediteurTelephone: string;
  destinataireNom: string;
  destinataireTelephone: string;
  destinataireAdresse: string;
  agenceDepartId: string;
  agenceArriveeId: string;
  collecteDomicile: boolean;
}

interface FormErrors {
  description?: string;
  expediteurNom?: string;
  expediteurTelephone?: string;
  destinataireNom?: string;
  destinataireTelephone?: string;
  destinataireAdresse?: string;
  agenceDepartId?: string;
  agenceArriveeId?: string;
}

enum ModalMode {
  AJOUT = 'ajout',
  VISUALISATION = 'visualisation',
  PESEE = 'pesee',
  CHARGER = 'charger',
  LIVRAISON = 'livraison',
  REMISE = 'remise'
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
  readonly StatutPaiementColis = StatutPaiementColis;
  readonly ModeRemise = ModeRemise;
  readonly TranchePoids = TranchePoids;
  readonly tranches = Object.values(TranchePoids);

  colisList: Colis[] = [];
  filteredColis: Colis[] = [];
  agences: Agence[] = [];
  trajets: Trajet[] = [];
  livreurs: UserResponse[] = [];

  // Pagination
  currentPage = 1;
  itemsPerPage = 8;
  paginatedColis: Colis[] = [];
  totalPages = 1;

  isLoading = true;
  errorMessage = '';
  searchTerm = '';
  selectedStatut: StatutColis | '' = '';

  agentAgenceId: string | null = null;
  isAdmin = false;

  // Modal
  isModalOpen = false;
  isSubmitting = false;
  formError = '';
  formSuccess = '';
  formErrors: FormErrors = {};
  modalMode: ModalMode = ModalMode.AJOUT;
  selectedColis: Colis | null = null;

  form: ColisForm = this.emptyForm();
  estimation: EstimationPrix | null = null;
  estimationError = '';
  estimating = false;

  // Pesée
  peseePoidsReel: number | null = null;
  peseeTranche: TranchePoids = TranchePoids.MOINS_DE_1KG;

  // Charger
  selectedTrajetId = '';

  // Livraison
  selectedLivreurId = '';

  constructor(
    private colisService: ColisService,
    private tarifService: TarifExpeditionService,
    private livreurService: LivreurService,
    private agenceService: AgenceService,
    private trajetService: TrajetService,
    private cd: ChangeDetectorRef,
    private currentUser: CurrentUserService
  ) {}

  ngOnInit(): void {
    this.agentAgenceId = this.currentUser.getAgenceId();
    this.isAdmin = this.currentUser.isGlobalView();
    this.loadAll();
  }

  loadAll(): void {
    this.isLoading = true;
    forkJoin({
      colis: this.colisService.getAll(this.isAdmin ? undefined : (this.agentAgenceId || undefined)),
      agences: this.agenceService.getAll(),
      trajets: this.trajetService.getAll(),
      livreurs: this.livreurService.getLivreurs()
    }).subscribe({
      next: r => {
        this.colisList = r.colis || [];
        this.agences = r.agences || [];
        this.trajets = r.trajets || [];
        this.livreurs = r.livreurs || [];
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
        c.destinataireNom.toLowerCase().includes(term) ||
        c.numeroSuivi?.toLowerCase().includes(term) ||
        c.agenceDepartNom?.toLowerCase().includes(term) ||
        c.agenceArriveeNom?.toLowerCase().includes(term);
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
      const end = Math.min(this.totalPages, start + max - 1);
      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  }

  // ── Estimation de prix en direct ──────────────────────────
  recalculerEstimation(): void {
    this.estimation = null;
    this.estimationError = '';

    const depart = this.agences.find(a => a.id === this.form.agenceDepartId);
    const arrivee = this.agences.find(a => a.id === this.form.agenceArriveeId);
    if (!depart?.villeId || !arrivee?.villeId) return;

    this.estimating = true;
    this.tarifService.estimer(
      depart.villeId, arrivee.villeId, this.form.tranchePoids, this.form.modeRemise, this.form.collecteDomicile
    ).subscribe({
      next: (e) => { this.estimation = e; this.estimating = false; },
      error: () => {
        this.estimating = false;
        this.estimationError = 'Aucun tarif configuré pour ce trajet et cette tranche de poids.';
      }
    });
  }

  // ── Ouverture des modales ──────────────────────────────────
  openCreate(): void {
    this.modalMode = ModalMode.AJOUT;
    this.form = this.emptyForm();
    if (!this.isAdmin && this.agentAgenceId) {
      this.form.agenceDepartId = this.agentAgenceId;
    }
    this.estimation = null;
    this.estimationError = '';
    this.openModalCommon();
  }

  openView(c: Colis): void {
    this.modalMode = ModalMode.VISUALISATION;
    this.selectedColis = c;
    this.openModalCommon();
  }

  openPesee(c: Colis): void {
    this.modalMode = ModalMode.PESEE;
    this.selectedColis = c;
    this.peseePoidsReel = null;
    this.peseeTranche = c.tranchePoids;
    this.openModalCommon();
  }

  openCharger(c: Colis): void {
    this.modalMode = ModalMode.CHARGER;
    this.selectedColis = c;
    this.selectedTrajetId = c.trajetId || '';
    this.openModalCommon();
  }

  remiseCodeOtp: string = '';

  openLivraison(c: Colis): void {
    this.modalMode = ModalMode.LIVRAISON;
    this.selectedColis = c;
    this.selectedLivreurId = c.livreurId || '';
    this.openModalCommon();
  }

  openRemise(c: Colis): void {
    this.modalMode = ModalMode.REMISE;
    this.selectedColis = c;
    this.remiseCodeOtp = '';
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

  // ── Trajets disponibles pour le "chargement" ──────────────
  get trajetsDisponibles(): Trajet[] {
    if (!this.selectedColis) return [];
    const depart = this.agences.find(a => a.id === this.selectedColis!.agenceDepartId);
    const arrivee = this.agences.find(a => a.id === this.selectedColis!.agenceArriveeId);

    return this.trajets.filter(t => {
      // Seuls les trajets programmés (ou statut équivalent)
      const isProgramme = t.statut === StatutTrajet.PROGRAMME ||
                          (t.statut as string) === 'PROGRAMME' ||
                          (t.statut as string) === 'PROGRAMMEE' ||
                          (t.statut as string) === 'EN_ATTENTE';
      if (!isProgramme) return false;

      // Filtrer selon la ligne départ -> arrivée
      if (depart && arrivee) {
        return (t.villeDepart?.id === depart.villeId || t.agenceDepartId === depart.id) &&
               (t.villeArrivee?.id === arrivee.villeId || t.agenceArriveeId === arrivee.id);
      }
      return true;
    });
  }

  // ── Validation / soumission création ──────────────────────
  validateForm(): boolean {
    this.formErrors = {};
    if (!this.form.description.trim()) this.formErrors.description = 'Champ obligatoire';
    if (!this.form.expediteurNom.trim()) this.formErrors.expediteurNom = 'Champ obligatoire';
    if (!this.form.expediteurTelephone.trim()) this.formErrors.expediteurTelephone = 'Champ obligatoire';
    if (!this.form.destinataireNom.trim()) this.formErrors.destinataireNom = 'Champ obligatoire';
    if (!this.form.destinataireTelephone.trim()) this.formErrors.destinataireTelephone = 'Champ obligatoire';
    if (!this.form.agenceDepartId) this.formErrors.agenceDepartId = 'Agence de départ requise';
    if (!this.form.agenceArriveeId) this.formErrors.agenceArriveeId = 'Agence d\'arrivée requise';
    if (this.form.agenceDepartId && this.form.agenceDepartId === this.form.agenceArriveeId) {
      this.formErrors.agenceArriveeId = 'Doit être différente de l\'agence de départ';
    }
    if (this.form.modeRemise === ModeRemise.LIVRAISON_DOMICILE && !this.form.destinataireAdresse.trim()) {
      this.formErrors.destinataireAdresse = 'Adresse obligatoire pour une livraison à domicile';
    }
    return Object.keys(this.formErrors).length === 0;
  }

  submitForm(): void {
    if (!this.validateForm()) return;
    this.isSubmitting = true;
    this.formError = '';

    const payload: ColisRequest = {
      description: this.form.description.trim(),
      tranchePoids: this.form.tranchePoids,
      dimensions: this.form.dimensions.trim() || undefined,
      modeRemise: this.form.modeRemise,
      expediteurNom: this.form.expediteurNom.trim(),
      expediteurTelephone: this.form.expediteurTelephone.trim(),
      destinataireNom: this.form.destinataireNom.trim(),
      destinataireTelephone: this.form.destinataireTelephone.trim(),
      destinataireAdresse: this.form.destinataireAdresse.trim() || undefined,
      agenceDepartId: this.form.agenceDepartId,
      agenceArriveeId: this.form.agenceArriveeId,
      collecteDomicile: this.form.collecteDomicile,
    };

    this.colisService.enregistrerColis(payload).subscribe({
      next: (n) => {
        this.isSubmitting = false;
        this.formSuccess = 'Colis enregistré avec succès.';
        this.colisList.unshift(n);
        this.applyFilters();
        setTimeout(() => this.closeModal(), 1500);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.formError = err.error?.message || 'Erreur lors de l\'enregistrement.';
      }
    });
  }

  submitPesee(): void {
    if (!this.selectedColis?.id || !this.peseePoidsReel || this.peseePoidsReel <= 0) {
      this.formError = 'Indiquez le poids réel pesé.';
      return;
    }
    this.isSubmitting = true;
    this.colisService.confirmerPeseeAjusterPrix(this.selectedColis.id, this.peseePoidsReel, this.peseeTranche).subscribe({
      next: (u) => { this.isSubmitting = false; this.replaceInList(u); this.closeModal(); },
      error: (err) => { this.isSubmitting = false; this.formError = err.error?.message || 'Erreur lors de la pesée.'; }
    });
  }

  submitCharger(): void {
    if (!this.selectedColis?.id || !this.selectedTrajetId) {
      this.formError = 'Sélectionnez un trajet.';
      return;
    }
    this.isSubmitting = true;
    this.colisService.chargerColisInTrajet(this.selectedColis.id, this.selectedTrajetId).subscribe({
      next: (u) => { this.isSubmitting = false; this.replaceInList(u); this.closeModal(); },
      error: (err) => { this.isSubmitting = false; this.formError = err.error?.message || 'Erreur lors du chargement.'; }
    });
  }

  submitLivraison(): void {
    if (!this.selectedColis?.id || !this.selectedLivreurId) {
      this.formError = 'Sélectionnez un livreur.';
      return;
    }
    this.isSubmitting = true;
    this.colisService.demarrerLivraison(this.selectedColis.id, this.selectedLivreurId).subscribe({
      next: (u) => { this.isSubmitting = false; this.replaceInList(u); this.closeModal(); },
      error: (err) => { this.isSubmitting = false; this.formError = err.error?.message || 'Erreur lors de l\'assignation.'; }
    });
  }

  submitRemise(): void {
    if (!this.selectedColis?.id) return;
    if (!this.remiseCodeOtp || this.remiseCodeOtp.trim().length !== 6) {
      this.formError = 'Le code secret OTP de retrait doit comporter exactement 6 chiffres.';
      return;
    }
    this.isSubmitting = true;
    this.formError = '';
    this.colisService.confirmerLivraison(this.selectedColis.id, this.remiseCodeOtp.trim()).subscribe({
      next: (u) => {
        this.isSubmitting = false;
        this.replaceInList(u);
        this.closeModal();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.formError = err.error?.message || 'Code secret OTP invalide.';
      }
    });
  }

  receptionner(c: Colis): void {
    if (!c.id) return;
    this.colisService.receptionnerColis(c.id).subscribe({
      next: (u) => this.replaceInList(u),
      error: (err) => alert(err.error?.message || 'Erreur réception.')
    });
  }

  confirmerLivraison(c: Colis): void {
    if (!c.id) return;
    this.colisService.confirmerLivraison(c.id).subscribe({
      next: (u) => this.replaceInList(u),
      error: (err) => alert(err.error?.message || 'Erreur confirmation livraison.')
    });
  }

  annuler(c: Colis): void {
    if (!c.id || !confirm('Annuler ce colis ?')) return;
    this.colisService.annuler(c.id).subscribe({
      next: () => { const i = this.colisList.findIndex(x => x.id === c.id); if (i !== -1) this.colisList[i].statut = StatutColis.ANNULE; this.applyFilters(); },
      error: (err) => alert(err.error?.message || 'Erreur annulation.')
    });
  }

  private replaceInList(u: Colis): void {
    const i = this.colisList.findIndex(x => x.id === u.id);
    if (i !== -1) this.colisList[i] = u;
    this.applyFilters();
  }

  getTrajetLabel(t: Trajet): string {
    return `${t.villeDepart?.nomVille || '?'} → ${t.villeArrivee?.nomVille || '?'} · ${t.dateDepart} ${t.heureDepart}`;
  }

  getStatutConfig(s: StatutColis): { label: string; css: string } {
    const map: Record<StatutColis, { label: string; css: string }> = {
      [StatutColis.EN_ATTENTE_DEPOT]:     { label: 'En attente de dépôt', css: 'st-attente' },
      [StatutColis.DEPOSE_EN_AGENCE]:     { label: 'Déposé en agence',    css: 'st-charge'  },
      [StatutColis.EN_TRANSIT]:           { label: 'En transit',          css: 'st-transit' },
      [StatutColis.ARRIVE_EN_AGENCE]:     { label: 'Arrivé en agence',    css: 'st-collecte'},
      [StatutColis.EN_COURS_LIVRAISON]:   { label: 'En livraison',        css: 'st-transit' },
      [StatutColis.LIVRE]:                { label: 'Livré',               css: 'st-livre'   },
      [StatutColis.RETOURNE]:             { label: 'Retourné',            css: 'st-annule'  },
      [StatutColis.PERDU]:                { label: 'Perdu',               css: 'st-annule'  },
      [StatutColis.ANNULE]:               { label: 'Annulé',              css: 'st-annule'  },
    };
    return map[s] || { label: s, css: '' };
  }

  getStatutPaiementLabel(s: StatutPaiementColis): string {
    const map: Record<StatutPaiementColis, string> = {
      [StatutPaiementColis.EN_ATTENTE]: 'Non payé',
      [StatutPaiementColis.PARTIELLEMENT_PAYE]: 'Partiellement payé',
      [StatutPaiementColis.PAYE]: 'Payé',
    };
    return map[s] || s;
  }

  getModeRemiseLabel(m: ModeRemise | string | undefined): string {
    if (!m) return '—';
    const map: Record<string, string> = {
      LIVRAISON_DOMICILE: 'Livraison domicile',
      RETRAIT_AGENCE: 'Retrait agence',
    };
    return map[m] || m;
  }

  getTrancheLabel(t: TranchePoids): string {
    const map: Record<TranchePoids, string> = {
      [TranchePoids.MOINS_DE_1KG]: 'Moins de 1 kg',
      [TranchePoids.DE_1_A_5KG]: '1 à 5 kg',
      [TranchePoids.DE_5_A_10KG]: '5 à 10 kg',
      [TranchePoids.DE_10_A_20KG]: '10 à 20 kg',
      [TranchePoids.PLUS_DE_20KG]: 'Plus de 20 kg',
    };
    return map[t] || t;
  }

  canPeser(c: Colis): boolean { return c.statut === StatutColis.EN_ATTENTE_DEPOT; }
  canCharger(c: Colis): boolean { return c.statut === StatutColis.DEPOSE_EN_AGENCE; }
  canReceptionner(c: Colis): boolean { return c.statut === StatutColis.EN_TRANSIT; }
  canDemarrerLivraison(c: Colis): boolean {
    return c.statut === StatutColis.ARRIVE_EN_AGENCE && c.modeRemise === ModeRemise.LIVRAISON_DOMICILE;
  }
  canConfirmerLivraison(c: Colis): boolean {
    return c.statut === StatutColis.EN_COURS_LIVRAISON ||
      (c.statut === StatutColis.ARRIVE_EN_AGENCE && c.modeRemise === ModeRemise.RETRAIT_AGENCE);
  }
  canCancel(c: Colis): boolean { return c.statut !== StatutColis.LIVRE && c.statut !== StatutColis.ANNULE; }

  getQrUrl(data: string): string {
    if (!data) return '';
    const targetUrl = data.startsWith('http') ? data : `http://localhost:4200/suivi/${data}`;
    return 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=' + encodeURIComponent(targetUrl);
  }

  envoyerWhatsApp(telephone: string, message: string): void {
    if (!telephone) return;
    let numClean = telephone.replace(/\D/g, '');
    if (!numClean.startsWith('228') && numClean.length === 8) {
      numClean = '228' + numClean;
    }
    const url = `https://wa.me/${numClean}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }

  envoyerWhatsAppDestinataire(c: Colis | null): void {
    if (!c) return;
    const lien = c.lienSuivi || ('http://localhost:4200/suivi/' + c.numeroSuivi);
    const msg = `Bonjour ${c.destinataireNom},\nUn colis vous est destiné (Réf: ${c.numeroSuivi}).\nCode secret de retrait : ${c.codeRetrait || 'N/A'}.\nSuivez l'état en direct : ${lien}`;
    this.envoyerWhatsApp(c.destinataireTelephone, msg);
  }

  envoyerWhatsAppExpediteur(c: Colis | null): void {
    if (!c) return;
    const lien = c.lienSuivi || ('http://localhost:4200/suivi/' + c.numeroSuivi);
    const msg = `Bonjour ${c.expediteurNom},\nVotre colis (Réf: ${c.numeroSuivi}) a bien été pris en charge par TransIA.\nSuivez son état en direct : ${lien}`;
    this.envoyerWhatsApp(c.expediteurTelephone, msg);
  }

  imprimerEtiquette(c: Colis | null): void {
    if (!c) return;
    const qrUrl = this.getQrUrl(c.qrCode || c.numeroSuivi || '');
    const printWindow = window.open('', '_blank', 'width=600,height=700');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Étiquette Colis - ${c.numeroSuivi}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 24px; text-align: center; color: #0f172a; }
            .badge { background: #3158f5; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; display: inline-block; font-size: 14px; }
            .card { border: 2px solid #0f172a; border-radius: 16px; padding: 24px; max-width: 400px; margin: 0 auto; }
            h2 { margin: 12px 0 4px; font-size: 26px; letter-spacing: 1px; color: #0f172a; }
            .route { font-size: 16px; font-weight: bold; color: #3158f5; margin: 12px 0; }
            .details { text-align: left; background: #f8fafc; padding: 14px; border-radius: 12px; margin-top: 16px; font-size: 13px; color: #334155; line-height: 1.6; border: 1px solid #e2e8f0; }
            .qr-img { width: 180px; height: 180px; margin: 16px 0; }
            @media print { body { padding: 0; } .card { border: 2px solid #000; } }
          </style>
        </head>
        <body>
          <div class="card">
            <span class="badge">TransIA Logistique</span>
            <h2>${c.numeroSuivi}</h2>
            <div class="route">${c.agenceDepartNom || 'Agence Départ'} &rarr; ${c.agenceArriveeNom || 'Agence Arrivée'}</div>
            <img src="${qrUrl}" class="qr-img" alt="QR Code Colis" />
            <p style="font-size: 12px; color: #64748b; margin: 0;">Scannez pour suivre en direct</p>
            <div class="details">
              <strong>Expéditeur :</strong> ${c.expediteurNom} (${c.expediteurTelephone})<br/>
              <strong>Destinataire :</strong> ${c.destinataireNom} (${c.destinataireTelephone})<br/>
              <strong>Remise :</strong> ${this.getModeRemiseLabel(c.modeRemise)}<br/>
              ${c.codeRetrait ? `<strong>Code Secret Retrait :</strong> <span style="font-size:16px; font-weight:bold; color:#3158f5;">${c.codeRetrait}</span>` : ''}
            </div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  private emptyForm(): ColisForm {
    return {
      description: '', tranchePoids: TranchePoids.MOINS_DE_1KG, dimensions: '',
      modeRemise: ModeRemise.RETRAIT_AGENCE,
      expediteurNom: '', expediteurTelephone: '',
      destinataireNom: '', destinataireTelephone: '', destinataireAdresse: '',
      agenceDepartId: '', agenceArriveeId: '', collecteDomicile: false,
    };
  }
}
