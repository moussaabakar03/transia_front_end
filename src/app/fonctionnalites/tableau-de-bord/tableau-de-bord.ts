import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { Sidebar } from '../../shared/composants/sidebar/sidebar';
import { Header } from '../../shared/composants/header/header';
import { StatsCards } from './composants/stats-cards/stats-cards';
import { ReservationsRecentes } from './composants/reservations-recentes/reservations-recentes';
import { ModaleApercu } from '../../shared/composants/modale-apercu/modale-apercu';
import { TrajetService } from '../../core/services/transport/trajet-service';
import { ReservationService } from '../../core/services/reservation-service';
import { Trajet } from '../../shared/models/trajet';
import { Reservation } from '../../shared/models/reservation.model';

@Component({
  selector: 'app-tableau-de-bord',
  standalone: true,
  imports: [
    CommonModule,
    Sidebar,
    Header,
    ModaleApercu,
    ReservationsRecentes,
    StatsCards
  ],
  templateUrl: './tableau-de-bord.html',
  styleUrl: './tableau-de-bord.scss'
})
export class TableauDeBord implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private trajetService = inject(TrajetService);
  private reservationService = inject(ReservationService);

  // États d'affichage des popups
  afficherModale: boolean = false;
  afficherChoix: boolean = false;
  projetSelectionne: any = null;
  refreshSignal: number = 0;

  // Données transport
  trajets: Trajet[] = [];
  reservations: Reservation[] = [];
  isLoadingTransport: boolean = true;

  // KPIs
  tauxOccupation: number = 0;
  trajetsDuJourCount: number = 0;
  reservationsEnAttenteCount: number = 0;
  revenuMois: number = 0;

  // Prochains départs + places disponibles
  prochainsDeparts: Trajet[] = [];
  placesDisponiblesParTrajet: { [id: string]: number } = {};

  ngOnInit(): void {
    this.chargerDonneesTransport();
  }

  get kpiData() {
    return {
      tauxOccupation: this.tauxOccupation,
      departsAujourdhui: this.trajetsDuJourCount,
      reservationsEnAttente: this.reservationsEnAttenteCount,
      revenusMois: this.revenuMois
    };
  }

  chargerDonneesTransport(): void {
    this.isLoadingTransport = true;
    forkJoin({
      listTrajets: this.trajetService.getAll(),
      listReservations: this.reservationService.getAll()
    }).subscribe({
      next: ({ listTrajets, listReservations }) => {
        this.trajets = listTrajets || [];
        this.reservations = listReservations || [];

        this.calculerKPITransport();
        this.calculerProchainsDeparts();

        this.isLoadingTransport = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ [Dashboard] Erreur lors du chargement des flux de transport:', err);
        this.isLoadingTransport = false;
        this.cdr.detectChanges();
      }
    });
  }

  private calculerKPITransport(): void {
    const maintenant = new Date();
    const aujString = maintenant.toISOString().split('T')[0];
    const moisCourant = maintenant.getMonth();
    const anneeCourante = maintenant.getFullYear();

    // 1. Trajets du jour
    this.trajetsDuJourCount = this.trajets.filter(t => t.dateDepart === aujString).length;

    // 2. Réservations en attente
    this.reservationsEnAttenteCount = this.reservations.filter(r => r.statut === 'EN_ATTENTE').length;

    // 3. Taux d'occupation global
    let totalPlacesReservees = 0;
    let totalCapaciteOfferte = 0;
    this.trajets.forEach(t => {
      if (t.vehicule?.capacite) {
        totalCapaciteOfferte += t.vehicule.capacite;
        const resFiltrees = this.reservations.filter(r => r.trajetId === t.id && r.statut !== 'ANNULEE');
        resFiltrees.forEach(r => totalPlacesReservees += r.nombrePlace);
      }
    });
    this.tauxOccupation = totalCapaciteOfferte > 0 ? (totalPlacesReservees / totalCapaciteOfferte) * 100 : 0;

    // 4. Revenus du mois
    this.revenuMois = 0;
    const resDuMois = this.reservations.filter(r => {
      if (r.statut !== 'CONFIRMEE' && r.statut !== 'EN_ATTENTE') return false;
      const dRes = new Date(r.dateReservation);
      return dRes.getMonth() === moisCourant && dRes.getFullYear() === anneeCourante;
    });
    resDuMois.forEach(r => {
      const tr = this.trajets.find(t => t.id === r.trajetId);
      if (tr) {
        this.revenuMois += (tr.tarif || 0) * r.nombrePlace;
      }
    });
  }

  private calculerProchainsDeparts(): void {
    const maintenant = new Date();
    this.prochainsDeparts = this.trajets
      .filter(t => {
        if (!t.dateDepart) return false;
        const [an, mois, jour] = t.dateDepart.split('-').map(Number);
        const dateEtHeureTrajet = new Date(an, mois - 1, jour);
        if (t.heureDepart) {
          const [h, m] = t.heureDepart.split(':').map(Number);
          dateEtHeureTrajet.setHours(h, m);
        }
        return dateEtHeureTrajet >= maintenant;
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.dateDepart}T${a.heureDepart || '00:00'}`);
        const dateB = new Date(`${b.dateDepart}T${b.heureDepart || '00:00'}`);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, 5);

    // Calcul asynchrone des places disponibles
    this.placesDisponiblesParTrajet = {};
    this.prochainsDeparts.forEach(t => {
      if (t.id) {
        this.reservationService.getPlacesTrajet(t.id).subscribe({
          next: (placesOccupees) => {
            const capaciteTotale = t.vehicule?.capacite || 0;
            this.placesDisponiblesParTrajet[t.id!] = capaciteTotale - placesOccupees;
            this.cdr.detectChanges();
          },
          error: () => {
            this.placesDisponiblesParTrajet[t.id!] = t.vehicule?.capacite || 0;
          }
        });
      }
    });
  }

  // Méthodes liées aux modales (inchangées)
  ouvrirPopUp(): void { this.afficherModale = true; this.cdr.detectChanges(); }
  fermerPopUp(): void { this.afficherModale = false; this.cdr.detectChanges(); }
  ouvrirSelection(): void { this.afficherChoix = true; this.cdr.detectChanges(); }
  fermerSelection(): void { this.afficherChoix = false; this.cdr.detectChanges(); }
  declencherCreationManuelle(): void { this.afficherChoix = false; this.ouvrirPopUp(); }
  ouvrirApercu(projet: any): void { this.projetSelectionne = projet; this.cdr.detectChanges(); }
  fermerApercu(): void { this.projetSelectionne = null; this.cdr.detectChanges(); }
  rafrachirDonnees(): void {
    this.refreshSignal++;
    this.fermerPopUp();
    this.chargerDonneesTransport();
  }
}