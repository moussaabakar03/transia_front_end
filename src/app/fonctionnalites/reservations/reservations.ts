import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import jsPDF from 'jspdf';
import { Billet, Reservation, StatutReservation, TypeReservation } from '../../shared/models/reservation.model';
import { ModePaiement, PaiementPayload } from '../../shared/models/paiement';
import { Sidebar } from '../../shared/composants/sidebar/sidebar';
import { Header } from '../../shared/composants/header/header';
import { Trajet } from '../../shared/models/trajet';
import { ReservationService } from '../../core/services/reservation-service';
import { TrajetService } from '../../core/services/transport/trajet-service';
import { PaiementService } from '../../core/services/paiement-service';

interface ReservationFormInterface {
  trajetId: string;
  nombrePlace: number;
  nomResponsable: string;
  nomsPassagers: string[];
  billets: Billet[];
  typeReservation: TypeReservation;
}

interface PaiementForm {
  montantVerse: number | null;
  reference: string;
  modePaiement: ModePaiement | '';
}

interface FormErrors {
  trajetId?: string;
  nombrePlace?: string;
  nomResponsable?: string;
}

interface PaiementErrors {
  montantVerse?: string;
  modePaiement?: string;
}

enum ModalMode {
  AJOUT          = 'ajout',
  MODIFICATION   = 'modification',
  VISUALISATION  = 'visualisation'
}

@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar, Header],
  templateUrl: './reservations.html',
  styleUrl: './reservations.scss',
})
export class Reservations implements OnInit {

  reservations: Reservation[] = [];
  filteredReservations: Reservation[] = [];
  trajets: Trajet[] = [];

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 5;
  paginatedReservations: Reservation[] = [];
  totalPages: number = 1;

  // Plan de sièges 
  siegesOccupes: string[] = [];
  siegesSelectionnes: string[] = [];
  capaciteVehicule: number = 0;
  siegesDisponibles: number[] = [];

  nombrePlacesDisponibles: number = 0;

  getQrUrl(data: string): string {
    return 'https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=' + encodeURIComponent(data);
  }

  isLoading    = true;
  errorMessage = '';
  searchTerm   = '';

  // ── Modal réservation ────────────────────────────────
  isModalOpen  = false;
  isSubmitting = false;
  formError    = '';
  formSuccess  = '';
  formErrors: FormErrors = {};
  modalMode: ModalMode   = ModalMode.AJOUT;
  editingId: string | null = null;

  saisirNomsPassagers: boolean | null = null;
  champsPassagers: string[] = [];

  form: ReservationFormInterface = this.emptyForm();

  // ── Modal paiement ───────────────────────────────────
  isPaiementModalOpen    = false;
  isPaiementSubmitting   = false;
  paiementError          = '';
  paiementSuccess        = '';
  paiementErrors: PaiementErrors = {};
  reservationEnCours: Reservation | null = null;

  paiementForm: PaiementForm = this.emptyPaiementForm();

  readonly ModePaiement = ModePaiement;

  modesPaiement = [
    { value: ModePaiement.ESPECES,      label: 'Espèces',       icon: 'money' },
    { value: ModePaiement.CARTE_BANCAIRE,        label: 'Carte bancaire', icon: 'credit_card'     },
    { value: ModePaiement.FLOOZ, label: 'FLOOZ',  icon: 'smartphone'      },
    { value: ModePaiement.TMONEY,     label: 'TMONEY',      icon: 'account_balance'      },
  ];

  statutOptions = [
    { value: StatutReservation.EN_ATTENTE, label: 'En attente' },
    { value: StatutReservation.CONFIRMEE,  label: 'Confirmée'  },
    { value: StatutReservation.ANNULEE,    label: 'Annulée'    },
    { value: StatutReservation.EXPIREE,    label: 'Expirée'    },
  ];

  constructor(
    private reservationService: ReservationService,
    private trajetService: TrajetService,
    private paiementService: PaiementService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void { this.loadData(); }

  loadData(): void {
    this.isLoading = true;
    forkJoin({
      reservations: this.reservationService.getAll(),
      trajets:      this.trajetService.getAll()
    }).subscribe({
      next: results => {
        this.reservations = results.reservations || [];
        this.trajets      = results.trajets      || [];
        this.applyFilter();
        this.updatePagination();
        this.isLoading = false;
        this.cd.detectChanges();
      },
      error: err => {
        console.error(err);
        this.errorMessage = 'Erreur lors du chargement.';
        this.isLoading    = false;
      }
    });
  }

  applyFilter(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredReservations = this.reservations.filter(r => {
      const trajet = this.getTrajet(r.trajetId);
      return !term ||
        trajet?.villeDepart?.nomVille?.toLowerCase().includes(term) ||
        trajet?.villeArrivee?.nomVille?.toLowerCase().includes(term) ||
        r.nomResponsable?.toLowerCase().includes(term);
    });
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredReservations.length / this.itemsPerPage) || 1;
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedReservations = this.filteredReservations.slice(startIndex, endIndex);
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePagination();
  }

  getPaginationPages(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    
    if (this.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
      const endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }

  // Button visibility conditions
  canEdit(reservation: Reservation): boolean {
    return reservation.statut === StatutReservation.EN_ATTENTE;
  }

  canCancel(reservation: Reservation): boolean {
    return reservation.statut === StatutReservation.EN_ATTENTE ||
           reservation.statut === StatutReservation.CONFIRMEE;
  }

  canPay(reservation: Reservation): boolean {
    return reservation.statut === StatutReservation.EN_ATTENTE;
  }

  // Le paiement doit être soldé à 100% avant de pouvoir télécharger/imprimer le billet — pas de
  // paiement partiel autorisé. Avant cette correction, n'importe quelle réservation avec des billets
  // (donc même non payée, EN_ATTENTE) pouvait être exportée en PDF.
  canExportPdf(reservation: Reservation): boolean {
    return reservation.statut === StatutReservation.CONFIRMEE &&
           !!(reservation.billets && reservation.billets.length > 0);
  }

  // Méthode appelée quand le trajet change (à brancher sur le select)
  onTrajetChange(): void {
    this.siegesSelectionnes = [];
    this.siegesOccupes = [];
    this.siegesDisponibles = [];
    if (this.form.trajetId) {
      const trajet = this.trajets.find(t => t.id === this.form.trajetId);
      if (trajet && trajet.vehicule) {
        // Générer le tableau des sièges de 1 à la capacité du véhicule
        this.siegesDisponibles = Array.from({ length: trajet.vehicule.capacite }, (_, i) => i + 1);
      }
      // Charger les sièges déjà occupés pour ce trajet
      this.reservationService.getOccupiedSeats(this.form.trajetId).subscribe({
        next: (sieges) =>{
          this.siegesOccupes = sieges,
          this.nombrePlacesDisponibles = this.siegesDisponibles.length - this.siegesOccupes.length;
          this.cd.detectChanges();

        },
        error: () => this.siegesOccupes = []
      });
    }
  }

  // Méthode pour convertir un numéro de siège en chaîne (pour les comparaisons)
  siegeToString(num: number): string {
    return String(num);
  }

  // Sélection / désélection d'un siège
  toggleSiege(siegeNum: number): void {
    const siegeStr = this.siegeToString(siegeNum);
    if (this.siegesOccupes.includes(siegeStr)) return; // occupé

    const index = this.siegesSelectionnes.indexOf(siegeStr);
    if (index >= 0) {
      this.siegesSelectionnes.splice(index, 1);
    } else {
      if (this.siegesSelectionnes.length >= this.form.nombrePlace) {
        // Optionnel : afficher un message ou empêcher
        return;
      }
      this.siegesSelectionnes.push(siegeStr);
    }
  }

  // ── Helpers ──────────────────────────────────────────
  getTrajet(trajetId: string): Trajet | undefined {
    return this.trajets.find(t => t.id === trajetId);
  }

  getTrajetDescription(trajetId: string): string {
    const t = this.getTrajet(trajetId);
    return t ? `${t.villeDepart?.nomVille} → ${t.villeArrivee?.nomVille}` : 'Inconnu';
  }

  getStatutLabel(statut: string): string {
    return this.statutOptions.find(o => o.value === statut)?.label || statut;
  }

  /** Calcule le montant total attendu pour la réservation en cours */
  get montantAttendu(): number {
    if (!this.reservationEnCours) return 0;
    const trajet = this.getTrajet(this.reservationEnCours.trajetId);
    return (trajet?.tarif || 0) * (this.reservationEnCours.nombrePlace || 0);
  }

  /** Calcule la monnaie à rendre */
  get monnaieARendre(): number {
    return Math.max(0, (this.paiementForm.montantVerse || 0) - this.montantAttendu);
  }

  /** True si le montant versé couvre le montant attendu */
  get montantSuffisant(): boolean {
    return (this.paiementForm.montantVerse || 0) >= this.montantAttendu;
  }

  // ── Passagers (formulaire réservation) ───────────────
  get nombrePassagersSupplementaires(): number {
    return Math.max(0, (this.form.nombrePlace || 1) - 1);
  }

  onNombrePlaceChange(): void {
    const n = this.nombrePassagersSupplementaires;
    if (this.champsPassagers.length < n) {
      while (this.champsPassagers.length < n) this.champsPassagers.push('');
    } else {
      this.champsPassagers = this.champsPassagers.slice(0, n);
    }
    if (n === 0) { this.saisirNomsPassagers = null; this.champsPassagers = []; }
    this.onFieldChange('nombrePlace');
  }

  onChoixSaisie(choix: boolean): void {
    this.saisirNomsPassagers = choix;
    if (choix) {
      const n = this.nombrePassagersSupplementaires;
      if (this.champsPassagers.length !== n) this.champsPassagers = Array(n).fill('');
    } else {
      this.champsPassagers = [];
    }
  }

  supprimerChampPassager(index: number): void { this.champsPassagers.splice(index, 1); }

  // trackBy indispensable ici : sans lui, *ngFor recrée le <input> à chaque frappe (la chaîne
  // change de valeur à chaque caractère, Angular la traite comme "élément supprimé + recréé"
  // faute d'identité stable) — le champ perdait le focus après chaque caractère saisi.
  trackByIndex(index: number): number { return index; }

  ajouterChampPassager(): void {
    if (this.champsPassagers.length < this.nombrePassagersSupplementaires)
      this.champsPassagers.push('');
  }

  // ── Actions tableau ───────────────────────────────────
  onView(id: string): void {
    const r = this.reservations.find(res => res.id === id);
    if (!r) return;
    this.editingId = id;
    this.modalMode = ModalMode.VISUALISATION;
    this.fillFormFromReservation(r);
    this.openModalCommon();
  }

  onEdit(id: string): void {
    const r = this.reservations.find(res => res.id === id);
    if (!r || r.statut !== StatutReservation.EN_ATTENTE) {
      alert('Seules les réservations en attente peuvent être modifiées.');
      return;
    }
    this.editingId = id;
    this.modalMode = ModalMode.MODIFICATION;
    this.fillFormFromReservation(r);
    this.openModalCommon();
  }

  onAnnuler(id: string): void {
    if (!confirm('Annuler cette réservation ?')) return;
    this.reservationService.annuler(id).subscribe({
      next: () => {
        const r = this.reservations.find(res => res.id === id);
        if (r) r.statut = StatutReservation.ANNULEE;
        this.applyFilter();
        this.updatePagination();
        this.cd.detectChanges();
      },
      error: err => {
        console.error('Erreur annulation:', err);
        const errorMsg = err.error?.message || err.error || 'Erreur lors de l\'annulation.';
        alert(errorMsg);
      }
    });
  }

  // ── Paiement ─────────────────────────────────────────
  onPayer(id: string): void {
    const r = this.reservations.find(res => res.id === id);
    if (!r) return;

    this.reservationEnCours  = r;
    this.paiementForm        = this.emptyPaiementForm();
    this.paiementError       = '';
    this.paiementSuccess     = '';
    this.paiementErrors      = {};
    this.isPaiementModalOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closePaiementModal(): void {
    if (this.isPaiementSubmitting) return;
    this.isPaiementModalOpen = false;
    this.reservationEnCours  = null;
    document.body.style.overflow = '';
  }

  /** Remplit automatiquement le montant exact */
  remplirMontantExact(): void {
    this.paiementForm.montantVerse = this.montantAttendu;
    if (this.paiementErrors.montantVerse) delete this.paiementErrors.montantVerse;
  }

  submitPaiement(): void {
    this.paiementError   = '';
    this.paiementSuccess = '';
    this.paiementErrors  = {};
    let hasError = false;

    if (!this.paiementForm.montantVerse || this.paiementForm.montantVerse <= 0) {
      this.paiementErrors.montantVerse = 'Le montant versé est obligatoire.';
      hasError = true;
    } else if (this.paiementForm.montantVerse < this.montantAttendu) {
      this.paiementErrors.montantVerse =
        `Montant insuffisant. Minimum requis : ${this.montantAttendu.toLocaleString()} FCFA.`;
      hasError = true;
    }

    if (!this.paiementForm.modePaiement) {
      this.paiementErrors.modePaiement = 'Le mode de paiement est obligatoire.';
      hasError = true;
    }

    if (hasError) return;

    this.isPaiementSubmitting = true;

    const payload: PaiementPayload = {
      reservationId:  this.reservationEnCours?.id || '',
      montantVerse:   this.paiementForm.montantVerse!,
      reference:      this.paiementForm.reference.trim() || this.genererReference(),
      modePaiement:   this.paiementForm.modePaiement as ModePaiement,

    };

    this.paiementService.payer(payload).subscribe({
      next: () => {
        this.isPaiementSubmitting = false;
        this.paiementSuccess = 'Paiement enregistré ! Billets confirmés.';

        // Mise à jour locale du statut
        const r = this.reservations.find(res => res.id === this.reservationEnCours!.id);
        if (r) r.statut = StatutReservation.CONFIRMEE;
        this.applyFilter();
        this.updatePagination();
        this.cd.detectChanges();

        setTimeout(() => this.closePaiementModal(), 2000);
      },
      error: err => {
        this.isPaiementSubmitting = false;
        this.paiementError = err.error?.message || err.error || 'Erreur lors du paiement.';
      }
    });
  }

  private genererReference(): string {
    return 'REF-' + Date.now().toString(36).toUpperCase();
  }

    // ── Export PDF Billets ────────────────────────────────
  async exporterBilletsPDF(id: string): Promise<void> {
    const r = this.reservations.find(res => res.id === id);
    if (!r) return;

    if (!this.canExportPdf(r)) {
      alert('Le paiement doit être réglé intégralement avant de pouvoir télécharger ou imprimer ce billet.');
      return;
    }

    const trajet = this.getTrajet(r.trajetId);
    const billets = r.billets || [];

    // ── Chargement des QR codes en base64 via canvas ──
    const loadImageBase64 = (url: string): Promise<string> =>
      new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width  = img.width;
          canvas.height = img.height;
          canvas.getContext('2d')!.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => resolve('');   // si le QR ne charge pas, on continue
        img.src = url;
      });

    const qrImages: string[] = [];
    for (const billet of billets) {
      qrImages.push(await loadImageBase64(this.getQrUrl(billet.qrCode || '')));
    }

    // ── Format compact façon "vrai billet de transport" : paysage, une page par billet, plutôt
    // que l'ancien format A4 avec 2 cartes par page (jugé trop grand/mal formaté). Même identité
    // visuelle que le billet téléchargé côté client mobile (bande bleue, QR à droite, perforation).
    const TW = 190;   // largeur billet (mm)
    const TH = 85;    // hauteur billet (mm)
    const M  = 9;     // marge intérieure gauche/droite du contenu
    const DIVIDER_X = 143; // séparation contenu / colonne QR

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [TW, TH] });

    const BLUE:      [number, number, number] = [20,  50, 120];
    const DARK:       [number, number, number] = [15,  23,  42];
    const GREY:       [number, number, number] = [100, 116, 139];
    const GREY_LIGHT: [number, number, number] = [203, 213, 225];
    const LIGHT:      [number, number, number] = [245, 247, 250];
    const GREEN_BG:   [number, number, number] = [220, 252, 231];
    const GREEN_FG:   [number, number, number] = [22, 101, 52];
    const ORANGE_BG:  [number, number, number] = [254, 243, 199];
    const ORANGE_FG:  [number, number, number] = [146, 64, 14];
    const BADGE_BG:   [number, number, number] = [219, 234, 254];

    const dep = trajet?.villeDepart?.nomVille  || '—';
    const arr = trajet?.villeArrivee?.nomVille || '—';
    const trajetLabel = `${dep} → ${arr}`;
    const dateHeure = [trajet?.dateDepart, trajet?.heureDepart].filter(Boolean).join('  •  ') || '—';
    const shortRef = (r.id || '').slice(-8).toUpperCase();

    const drawInfo = (label: string, value: string, x: number, y: number) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(...GREY);
      doc.text(label, x, y);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...DARK);
      doc.text(value, x, y + 6.5);
    };

    const drawTicket = (billet: Billet | null, qrBase64: string, index: number, total: number) => {
      const isValide  = billet?.statut === 'VALIDE';
      const statutTxt = isValide ? 'PAYÉ' : 'EN ATTENTE';
      const statutBg  = isValide ? GREEN_BG : ORANGE_BG;
      const statutFg  = isValide ? GREEN_FG : ORANGE_FG;

      // Bordure + bande gauche
      doc.setDrawColor(...GREY_LIGHT);
      doc.setLineWidth(0.3);
      doc.rect(0.5, 0.5, TW - 1, TH - 1);
      doc.setFillColor(...BLUE);
      doc.rect(0, 0, 4, TH, 'F');

      // En-tête
      doc.setTextColor(...BLUE);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('TRANSIA', M, 12);
      const wTransia = doc.getTextWidth('TRANSIA');
      doc.setTextColor(...GREY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text('Billet de transport', M + wTransia + 4, 12);

      // Badge n° billet
      const badgeLabel = `${index + 1} / ${total}`;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      const badgeW = doc.getTextWidth(badgeLabel) + 6;
      const badgeX = DIVIDER_X - 4 - badgeW;
      doc.setFillColor(...BADGE_BG);
      doc.roundedRect(badgeX, 6, badgeW, 6, 1.5, 1.5, 'F');
      doc.setTextColor(...BLUE);
      doc.text(badgeLabel, badgeX + badgeW / 2, 10.2, { align: 'center' });

      // Séparateur pointillé
      doc.setDrawColor(...GREY_LIGHT);
      doc.setLineWidth(0.25);
      doc.setLineDashPattern([1.2, 1], 0);
      doc.line(M, 16, DIVIDER_X - 4, 16);
      doc.setLineDashPattern([], 0);

      // Trajet + statut
      doc.setTextColor(...DARK);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.text(trajetLabel, M, 26);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      const statutW = doc.getTextWidth(statutTxt) + 6;
      const statutX = DIVIDER_X - 4 - statutW;
      doc.setFillColor(...statutBg);
      doc.roundedRect(statutX, 20, statutW, 6, 1.5, 1.5, 'F');
      doc.setTextColor(...statutFg);
      doc.text(statutTxt, statutX + statutW / 2, 24.2, { align: 'center' });

      // Date / heure
      doc.setTextColor(...GREY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.text(dateHeure, M, 33);

      // Grille d'infos compacte
      const col2X = M + 90;
      drawInfo('PASSAGER', billet?.nomPassager || r.nomResponsable || '—', M, 46);
      drawInfo('SIÈGE', String(billet?.numeroSiege || '—'), col2X, 46);
      drawInfo('RÉF. RÉSERVATION', shortRef, M, 63);
      drawInfo('PRIX', `${(trajet?.tarif || 0).toLocaleString()} FCFA`, col2X, 63);

      // Perforation verticale (séparation avec le coupon QR)
      doc.setDrawColor(...GREY_LIGHT);
      doc.setLineWidth(0.25);
      doc.setLineDashPattern([1.2, 1], 0);
      doc.line(DIVIDER_X, 6, DIVIDER_X, TH - 6);
      doc.setLineDashPattern([], 0);

      // QR code
      const qrColCenter = DIVIDER_X + (TW - DIVIDER_X) / 2;
      const qrSize = 32;
      const qrX = qrColCenter - qrSize / 2;
      const qrY = 12;

      if (qrBase64) {
        doc.addImage(qrBase64, 'PNG', qrX, qrY, qrSize, qrSize);
      } else {
        doc.setFillColor(...LIGHT);
        doc.roundedRect(qrX, qrY, qrSize, qrSize, 2, 2, 'F');
        doc.setTextColor(...GREY);
        doc.setFontSize(6.5);
        doc.text('QR indisponible', qrColCenter, qrY + qrSize / 2, { align: 'center', maxWidth: qrSize });
      }

      doc.setTextColor(...GREY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.text('Scannez pour valider', qrColCenter, qrY + qrSize + 5, { align: 'center' });
    };

    // ── Construction du PDF : une page par billet ──
    if (billets.length === 0) {
      doc.setDrawColor(...GREY_LIGHT);
      doc.setLineWidth(0.3);
      doc.rect(0.5, 0.5, TW - 1, TH - 1);
      doc.setFillColor(...BLUE);
      doc.rect(0, 0, 4, TH, 'F');
      doc.setTextColor(...BLUE);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('TRANSIA', M, 12);
      doc.setTextColor(...GREY);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(10);
      doc.text('Aucun billet généré — paiement en attente.', TW / 2, TH / 2, { align: 'center' });
    } else {
      billets.forEach((billet, index) => {
        if (index > 0) doc.addPage([TW, TH], 'landscape');
        drawTicket(billet, qrImages[index], index, billets.length);
      });
    }

    // ── Sauvegarde ──
    const safeName = (r.nomResponsable || 'passager').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
    doc.save(`TRANSIA_Billets_${safeName}_${(r.id || '').slice(-6).toUpperCase()}.pdf`);
  }

  // ── Formulaires ──────────────────────────────────────
  private fillFormFromReservation(r: Reservation): void {
    const autres = r.billets
      ?.map(b => b.nomPassager)
      .filter(name => name !== r.nomResponsable) || [];
    this.form = {
      trajetId: r.trajetId, nombrePlace: r.nombrePlace,
      nomResponsable: r.nomResponsable || '', nomsPassagers: autres,
      billets: r.billets || [], typeReservation: r.typeReservation || TypeReservation.PRESENTIEL
    };
    if (autres.length > 0) {
      this.saisirNomsPassagers = true;
      this.champsPassagers = [...autres];
    } else {
      this.saisirNomsPassagers = null;
      this.champsPassagers = [];
    }
  }

  openModal(): void {
    this.modalMode = ModalMode.AJOUT;
    this.editingId = null;
    this.form = this.emptyForm();
    this.saisirNomsPassagers = null;
    this.champsPassagers = [];
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
    document.body.style.overflow = '';
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isPaiementModalOpen) { this.closePaiementModal(); return; }
    if (this.isModalOpen) this.closeModal();
  }

  private emptyForm(): ReservationFormInterface {
    return {
      trajetId: '', nombrePlace: 1, nomResponsable: '',
      nomsPassagers: [], billets: [], typeReservation: TypeReservation.PRESENTIEL
    };
  }

  private emptyPaiementForm(): PaiementForm {
    return { montantVerse: null, reference: '', modePaiement: '' };
  }

  onFieldChange(field: keyof FormErrors): void {
    if (this.formErrors[field]) delete this.formErrors[field];
  }

  submitForm(): void {
    this.formError = ''; this.formSuccess = ''; this.formErrors = {};
    let hasError = false;
    if (!this.form.trajetId)             { this.formErrors.trajetId      = 'Le trajet est obligatoire.';         hasError = true; }
    if (!this.form.nombrePlace || this.form.nombrePlace < 1)
                                          { this.formErrors.nombrePlace   = 'Au moins 1 place requise.';          hasError = true; }
    if (!this.form.nomResponsable.trim()) { this.formErrors.nomResponsable = 'Le nom du responsable est requis.'; hasError = true; }
    if (hasError) return;

    let nomsPassagers: string[] = [];
    if (this.saisirNomsPassagers === true)
      nomsPassagers = this.champsPassagers.map(n => n.trim());

    this.isSubmitting = true;
    const payload = {
      trajetId: this.form.trajetId,
      nombrePlace: this.form.nombrePlace,
      nomResponsable: this.form.nomResponsable.trim(),
      nomsPassagers, typeReservation: TypeReservation.PRESENTIEL,
      siegesChoisis: this.siegesSelectionnes.length > 0 ? this.siegesSelectionnes : undefined
    };

    if (this.modalMode === ModalMode.AJOUT) {
      this.reservationService.create(payload).subscribe({
        next: (nouvelle) => {
          this.isSubmitting = false;
          this.formSuccess  = 'Réservation créée avec succès.';
          this.reservations.push(nouvelle);
          this.applyFilter();
          this.updatePagination();
          setTimeout(() => this.closeModal(), 1500);
        },
        error: err => { this.isSubmitting = false; this.formError = err.error?.message || 'Erreur.'; }
      });
    } else {
      if (!this.editingId) return;
      this.reservationService.update(this.editingId, payload).subscribe({
        next: (modifiee) => {
          this.isSubmitting = false;
          this.formSuccess  = 'Réservation modifiée.';
          const index = this.reservations.findIndex(r => r.id === this.editingId);
          if (index !== -1) this.reservations[index] = modifiee;
          this.applyFilter();
          this.updatePagination();
          setTimeout(() => this.closeModal(), 1500);
        },
        error: err => { this.isSubmitting = false; this.formError = err.error?.message || 'Erreur.'; }
      });
    }
  }

}
