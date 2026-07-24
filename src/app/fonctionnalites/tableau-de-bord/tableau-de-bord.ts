import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { Sidebar } from '../../shared/composants/sidebar/sidebar';
import { Header } from '../../shared/composants/header/header';
import { TrajetService } from '../../core/services/transport/trajet-service';
import { ReservationService } from '../../core/services/reservation-service';
import { ColisService } from '../../core/services/colis.service';
import { CurrentUserService } from '../../core/services/current-user.service';
import { Trajet } from '../../shared/models/trajet';
import { Reservation } from '../../shared/models/reservation.model';
import { Colis, StatutColis } from '../../shared/models/colis.model';

@Component({
  selector: 'app-tableau-de-bord',
  standalone: true,
  imports: [CommonModule, Sidebar, Header],
  templateUrl: './tableau-de-bord.html',
  styleUrl: './tableau-de-bord.scss'
})
export class TableauDeBord implements OnInit {

  // ── Contexte utilisateur ──────────────────────────────
  fullName   = '';
  role       = '';
  agenceNom  = '';
  villeNom   = '';
  villeId:   string | null = null;
  agenceId:  string | null = null;
  isAdmin    = false;
  today      = new Date();

  // ── Données brutes ────────────────────────────────────
  allTrajets:       Trajet[]      = [];
  allReservations:  Reservation[] = [];
  allColis:         Colis[]       = [];

  // ── Données filtrées ──────────────────────────────────
  trajets:      Trajet[]      = [];
  reservations: Reservation[] = [];
  colis:        Colis[]       = [];

  isLoading = true;

  // ── KPIs Transport ────────────────────────────────────
  departsAujourdhui     = 0;
  reservationsEnAttente = 0;
  tauxOccupation        = 0;
  revenusMois           = 0;

  // ── KPIs Colis ────────────────────────────────────────
  colisEnAttente  = 0;
  colisEnTransit  = 0;
  colisLivres     = 0;

  // ── Tableaux résumés ──────────────────────────────────
  prochainsDeparts:    Trajet[]      = [];
  reservationsRecentes: Reservation[] = [];
  colisRecents:        Colis[]       = [];

  constructor(
    private trajetService:      TrajetService,
    private reservationService: ReservationService,
    private colisService:       ColisService,
    private currentUser:        CurrentUserService,
    private cdr:                ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.fullName  = this.currentUser.getFullName();
    this.role      = this.currentUser.getRole();
    this.agenceNom = this.currentUser.getAgenceNom() || '';
    this.villeNom  = this.currentUser.getVilleNom()  || '';
    this.villeId   = this.currentUser.getVilleId();
    this.agenceId  = this.currentUser.getAgenceId();
    this.isAdmin   = this.currentUser.isGlobalView();
    this.chargerDonnees();
  }

  chargerDonnees(): void {
    this.isLoading = true;
    forkJoin({
      trajets:      this.trajetService.getAll(),
      reservations: this.reservationService.getAll(),
      colis:        this.colisService.getAll()
    }).subscribe({
      next: r => {
        this.allTrajets      = r.trajets      || [];
        this.allReservations = r.reservations || [];
        this.allColis        = r.colis        || [];

        this.filtrerParContexte();
        this.calculerKPIs();
        this.preparerTableaux();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.isLoading = false; this.cdr.detectChanges(); }
    });
  }

  private filtrerParContexte(): void {
    if (this.isAdmin || !this.villeId) {
      // ADMIN — toutes les données
      this.trajets      = this.allTrajets;
      this.reservations = this.allReservations;
      this.colis        = this.allColis;
    } else {
      // AGENT — filtrer par ville de l'agence
      this.trajets = this.allTrajets.filter(t =>
        t.villeDepart.id === this.villeId || t.villeArrivee.id === this.villeId
      );
      const trajetIds = new Set(this.trajets.map(t => t.id));
      this.reservations = this.allReservations.filter(r => trajetIds.has(r.trajetId));
      this.colis = this.allColis.filter(c =>
        c.agenceDepartId === this.agenceId || c.agenceArriveeId === this.agenceId
      );
    }
  }

  private calculerKPIs(): void {
    const today  = new Date().toISOString().split('T')[0];
    const now    = new Date();
    const mois   = now.getMonth();
    const annee  = now.getFullYear();

    // Transport
    this.departsAujourdhui     = this.trajets.filter(t => t.dateDepart === today).length;
    this.reservationsEnAttente = this.reservations.filter(r => r.statut === 'EN_ATTENTE').length;

    let placesReservees = 0, capaciteTotale = 0;
    this.trajets.forEach(t => {
      if (t.vehicule?.capacite) {
        capaciteTotale  += t.vehicule.capacite;
        const resTraj    = this.reservations.filter(r => r.trajetId === t.id && r.statut !== 'ANNULEE');
        resTraj.forEach(r => placesReservees += r.nombrePlace);
      }
    });
    this.tauxOccupation = capaciteTotale > 0
      ? Math.round((placesReservees / capaciteTotale) * 100) : 0;

    const resMois = this.reservations.filter(r => {
      if (r.statut !== 'CONFIRMEE' && r.statut !== 'EN_ATTENTE') return false;
      const d = new Date(r.dateReservation);
      return d.getMonth() === mois && d.getFullYear() === annee;
    });
    this.revenusMois = resMois.reduce((sum, r) => {
      const tarif = this.trajets.find(t => t.id === r.trajetId)?.tarif || 0;
      return sum + tarif * r.nombrePlace;
    }, 0);

    // Colis
    this.colisEnAttente = this.colis.filter(c =>
      c.statut === StatutColis.EN_ATTENTE_DEPOT || c.statut === StatutColis.DEPOSE_EN_AGENCE
    ).length;
    this.colisEnTransit = this.colis.filter(c =>
      c.statut === StatutColis.EN_TRANSIT || c.statut === StatutColis.ARRIVE_EN_AGENCE ||
      c.statut === StatutColis.EN_COURS_LIVRAISON
    ).length;
    this.colisLivres = this.colis.filter(c => c.statut === StatutColis.LIVRE).length;
  }

  private preparerTableaux(): void {
    const now = new Date();

    // Prochains départs (5 max)
    this.prochainsDeparts = this.trajets
      .filter(t => {
        if (!t.dateDepart) return false;
        const dt = new Date(`${t.dateDepart}T${t.heureDepart || '00:00'}`);
        return dt >= now;
      })
      .sort((a, b) =>
        new Date(`${a.dateDepart}T${a.heureDepart||'00:00'}`).getTime() -
        new Date(`${b.dateDepart}T${b.heureDepart||'00:00'}`).getTime()
      )
      .slice(0, 5);

    // Réservations récentes (5 max)
    this.reservationsRecentes = [...this.reservations]
      .sort((a, b) => new Date(b.dateReservation).getTime() - new Date(a.dateReservation).getTime())
      .slice(0, 5);

    // Colis récents (5 max)
    this.colisRecents = [...this.colis]
      .sort((a, b) => new Date(b.dateCreation || 0).getTime() - new Date(a.dateCreation || 0).getTime())
      .slice(0, 5);
  }

  getTrajetLabel(trajetId: string): string {
    const t = this.trajets.find(x => x.id === trajetId);
    return t ? `${t.villeDepart.nomVille} → ${t.villeArrivee.nomVille}` : '—';
  }

  getStatutColisClass(s: StatutColis): string {
    const m: Record<string, string> = {
      EN_ATTENTE_DEPOT: 'st-attente', DEPOSE_EN_AGENCE: 'st-charge',
      EN_TRANSIT: 'st-transit', ARRIVE_EN_AGENCE: 'st-collecte',
      EN_COURS_LIVRAISON: 'st-transit', LIVRE: 'st-livre',
      RETOURNE: 'st-annule', PERDU: 'st-annule', ANNULE: 'st-annule'
    };
    return m[s] || '';
  }

  getStatutColisLabel(s: StatutColis): string {
    const m: Record<string, string> = {
      EN_ATTENTE_DEPOT: 'En attente de dépôt', DEPOSE_EN_AGENCE: 'Déposé en agence',
      EN_TRANSIT: 'En transit', ARRIVE_EN_AGENCE: 'Arrivé en agence',
      EN_COURS_LIVRAISON: 'En livraison', LIVRE: 'Livré',
      RETOURNE: 'Retourné', PERDU: 'Perdu', ANNULE: 'Annulé'
    };
    return m[s] || s;
  }

  get pagesArray(): number[] { return Array(this.tauxOccupation).fill(0); }

  getInitiale(): string {
    return this.fullName ? this.fullName.charAt(0).toUpperCase() : '?';
  }
}