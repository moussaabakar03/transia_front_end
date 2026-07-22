import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Sidebar } from '../../../shared/composants/sidebar/sidebar';
import { Header } from '../../../shared/composants/header/header';
import { Trajet, StatutTrajet } from '../../../shared/models/trajet';
import { TrajetService } from '../../../core/services/transport/trajet-service';
import { VilleService } from '../../../core/services/transport/ville-service';
import { VehiculeService } from '../../../core/services/transport/vehicule-service';
import { UserService } from '../../../core/services/user-service';
import { CurrentUserService } from '../../../core/services/current-user.service';
import { Ville } from '../../../shared/models/ville';
import { Vehicule } from '../../../shared/models/vehicule';
import { Reservation, StatutReservation } from '../../../shared/models/reservation.model';
import { ReservationService } from '../../../core/services/reservation-service';

@Component({
  selector: 'app-trajets',
  standalone: true,
  imports: [CommonModule, Sidebar, Header, FormsModule],
  templateUrl: './trajets.html',
  styleUrl: './trajets.scss',
})
export class Trajets implements OnInit {
  // Affichage paginé
  trajetsAffiches: Trajet[] = [];

  // États des modales
  afficherCreationTrajet: boolean = false;
  afficherEditTrajet: boolean = false;
  afficherDetailTrajet: boolean = false;

  // Données éditées / en cours
  trajetEditer: Trajet | null = null;
  trajetVoir: Trajet | null = null;

  // Réservations liées au trajet consulté (modale détail) + statistiques dérivées
  reservationsDuTrajet: Reservation[] = [];
  chargementReservationsTrajet = false;
  statsTrajet: {
    placesReservees: number;
    placesDisponibles: number;
    capacite: number;
    tauxRemplissage: number;
    montantEncaisse: number;
    nombreReservations: number;
  } | null = null;
  readonly StatutReservation = StatutReservation;
  nouveauTrajet: any = {
    villeDepartId: '',
    villeArriveeId: '',
    vehiculeId: '',
    chauffeurId: null,
    distance: 0,
    dureeEstimee: '',
    tarif: 0,
    dateDepart: '',
    heureDepart: '',
    statut: StatutTrajet.PROGRAMME
  };

  // Pagination
  pageActuelle: number = 1;
  readonly parPage: number = 5;
  totalTrajets: number = 0;

  // Recherche
  valeurSaisi: string = '';

  // Sources de données
  tousLesTrajets: Trajet[] = [];
  resultatsFiltres: Trajet[] = [];

  // Listes pour les select dropdowns
  villes: Ville[] = [];
  vehicules: Vehicule[] = [];
  chauffeurs: any[] = [];

  // Enum pour le template
  StatutTrajet = StatutTrajet;

  // Contexte agent connecté
  agentVilleId:  string | null = null;
  agentVilleNom: string | null = null;
  agentAgenceId: string | null = null;
  isAdmin = false;

  // Droits d'écriture (SUPER_ADMIN/ADMIN_AGENCE, cf. TrajetController côté backend)
  peutGerer: boolean = false;

  constructor(
    private trajetService:       TrajetService,
    private villeService:        VilleService,
    private vehiculeService:     VehiculeService,
    private userService:         UserService,
    private currentUser:         CurrentUserService,
    private reservationService:  ReservationService
  ) {}

  ngOnInit(): void {
    const ctx        = this.currentUser.getContext();
    this.agentVilleId  = ctx?.villeId  ?? null;
    this.agentVilleNom = ctx?.villeNom ?? null;
    this.agentAgenceId = ctx?.agenceId ?? null;
    this.isAdmin       = this.currentUser.isGlobalView();
    this.peutGerer     = this.currentUser.peutGererTransport();

    this.loadTrajets();
    this.loadVilles();
    this.loadVehicules();
    this.loadChauffeurs(this.agentVilleId ?? undefined);
  }

  // Charger les listes pour les select dropdowns
  loadVilles(): void {
    this.villeService.getAllVilles().subscribe({
      next: (data) => {
        this.villes = data;
      },
      error: (err) => console.error('Erreur de chargement des villes', err)
    });
  }

  loadVehicules(): void {
    this.vehiculeService.getAll().subscribe({
      next: (data) => {
        this.vehicules = data;
      },
      error: (err) => console.error('Erreur de chargement des véhicules', err)
    });
  }

  loadChauffeurs(villeId?: string): void {
    this.userService.getChauffeurs(villeId).subscribe({
      next: (data: any[]) => {
        this.chauffeurs = data;
      },
      error: (err: any) => console.error('Erreur de chargement des chauffeurs', err)
    });
  }

  // Le chauffeur doit être disponible dans la ville de départ choisie : on recharge la liste
  // et on réinitialise la sélection si elle ne correspond plus (le backend valide de toute façon à la soumission).
  onVilleDepartChange(villeId: string, cible: { chauffeurId?: string | null }): void {
    cible.chauffeurId = null;
    this.loadChauffeurs(villeId || undefined);
  }

  // Chargement initial depuis l'API.
  // GET /trajet n'est volontairement pas filtré par agence côté backend (le client mobile doit
  // parcourir tous les trajets, toutes agences, pour réserver). Sur ce panneau admin en revanche,
  // un ADMIN_AGENCE ne doit voir que les trajets de sa propre agence (cohérent avec Vehicules) :
  // filtrage appliqué ici, côté client.
  loadTrajets(): void {
    this.trajetService.getAll().subscribe({
      next: (data) => {
        const visibles = this.isAdmin
          ? data
          : data.filter(t => this.agentAgenceId != null && t.agenceId === this.agentAgenceId);
        this.tousLesTrajets = visibles;
        this.resultatsFiltres = [...visibles];
        this.totalTrajets = this.resultatsFiltres.length;
        this.pageActuelle = 1;
        this.appliquerPage();
      },
      error: (err) => console.error('Erreur de chargement des trajets', err)
    });
  }

  // Filtrage en temps réel
  filtrerTrajets(): void {
    if (!this.valeurSaisi.trim()) {
      this.resultatsFiltres = [...this.tousLesTrajets];
    } else {
      const terme = this.valeurSaisi.toLowerCase().trim();
      this.resultatsFiltres = this.tousLesTrajets.filter(trajet =>
        trajet.villeDepart?.nomVille?.toLowerCase().includes(terme) ||
        trajet.villeArrivee?.nomVille?.toLowerCase().includes(terme) ||
        trajet.vehicule?.immatriculation?.toLowerCase().includes(terme)
      );
    }
    this.totalTrajets = this.resultatsFiltres.length;
    this.pageActuelle = 1;
    this.appliquerPage();
  }

  // Appliquer la pagination
  private appliquerPage(): void {
    const debut = (this.pageActuelle - 1) * this.parPage;
    this.trajetsAffiches = this.resultatsFiltres.slice(debut, debut + this.parPage);
  }

  get totalPages(): number {
    return Math.ceil(this.totalTrajets / this.parPage);
  }

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

  supprimerTrajet(id: string | undefined, description: string): void {
    if (!id) return;
    
    if (confirm(`Voulez-vous annuler le trajet ${description} ? Le véhicule sera libéré.`)) {
      this.trajetService.delete(id).subscribe({
        next: () => {
          alert(`Le trajet a été annulé.`);
          this.loadTrajets();
        },
        error: (err) => {
          console.error('Erreur lors de l\'annulation', err);
          alert('Impossible d\'annuler ce trajet.');
        }
      });
    }
  }

  ouvrirCreation(): void {
    this.nouveauTrajet = {
      villeDepartId: this.agentVilleId ?? '',
      villeArriveeId: '',
      vehiculeId: '',
      chauffeurId: null,
      distance: 0,
      dureeEstimee: '',
      tarif: 0,
      dateDepart: '',
      heureDepart: '',
      statut: StatutTrajet.PROGRAMME
    };
    this.afficherCreationTrajet = true;
  }

  soumettreCreation(): void {
    if (!this.nouveauTrajet.villeDepartId || !this.nouveauTrajet.villeArriveeId || 
        !this.nouveauTrajet.vehiculeId || !this.nouveauTrajet.dateDepart || !this.nouveauTrajet.heureDepart) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    // Validation : ville de départ et d'arrivée doivent être différentes
    if (this.nouveauTrajet.villeDepartId === this.nouveauTrajet.villeArriveeId) {
      alert('La ville de départ et la ville d\'arrivée doivent être différentes.');
      return;
    }

    this.trajetService.create(this.nouveauTrajet).subscribe({
      next: () => {
        this.afficherCreationTrajet = false;
        this.loadTrajets();
      },
      error: (err) => console.error('Erreur lors de la création', err)
    });
  }

  ouvrirEdit(trajet: Trajet): void {
    this.trajetEditer = { ...trajet };
    this.afficherEditTrajet = true;
  }

  soumettreModification(): void {
    if (!this.trajetEditer || !this.trajetEditer.id) return;

    const payload = {
      villeDepartId: this.trajetEditer.villeDepart?.id,
      villeArriveeId: this.trajetEditer.villeArrivee?.id,
      vehiculeId: this.trajetEditer.vehicule?.id,
      chauffeurId: this.trajetEditer.chauffeurId,
      distance: this.trajetEditer.distance,
      dureeEstimee: this.trajetEditer.dureeEstimee,
      tarif: this.trajetEditer.tarif,
      dateDepart: this.trajetEditer.dateDepart,
      heureDepart: this.trajetEditer.heureDepart,
      statut: this.trajetEditer.statut
    };

    // Validation : ville de départ et d'arrivée doivent être différentes
    if (payload.villeDepartId === payload.villeArriveeId) {
      alert('La ville de départ et la ville d\'arrivée doivent être différentes.');
      return;
    }

    this.trajetService.update(this.trajetEditer.id, payload).subscribe({
      next: () => {
        this.afficherEditTrajet = false;
        this.trajetEditer = null;
        this.loadTrajets();
      },
      error: (err) => console.error('Erreur lors de la modification', err)
    });
  }

  // Voir le détail d'un trajet, avec ses réservations liées et quelques statistiques dérivées
  ouvrirDetail(trajet: Trajet): void {
    this.trajetVoir = trajet;
    this.afficherDetailTrajet = true;
    this.reservationsDuTrajet = [];
    this.statsTrajet = null;

    if (!trajet.id) return;

    this.chargementReservationsTrajet = true;
    this.reservationService.getByTrajet(trajet.id).subscribe({
      next: (reservations) => {
        this.reservationsDuTrajet = reservations;
        this.statsTrajet = this.calculerStatsTrajet(trajet, reservations);
        this.chargementReservationsTrajet = false;
      },
      error: (err) => {
        console.error('Erreur de chargement des réservations du trajet', err);
        this.chargementReservationsTrajet = false;
      }
    });
  }

  // Places "occupantes" = réservations non annulées/expirées (même règle que le backend pour la
  // vérification de capacité) ; montant encaissé = paiements des réservations effectivement confirmées.
  private calculerStatsTrajet(trajet: Trajet, reservations: Reservation[]) {
    const occupantes = reservations.filter(r =>
      r.statut === StatutReservation.EN_ATTENTE || r.statut === StatutReservation.CONFIRMEE
    );
    const placesReservees = occupantes.reduce((total, r) => total + (r.nombrePlace || 0), 0);
    const capacite = trajet.vehicule?.capacite || 0;
    const placesDisponibles = Math.max(0, capacite - placesReservees);
    const tauxRemplissage = capacite > 0 ? Math.round((placesReservees / capacite) * 100) : 0;
    const montantEncaisse = reservations
      .filter(r => r.statut === StatutReservation.CONFIRMEE)
      .reduce((total, r) => total + (r.paiement?.montantVerse || 0), 0);

    return {
      placesReservees,
      placesDisponibles,
      capacite,
      tauxRemplissage,
      montantEncaisse,
      nombreReservations: reservations.length
    };
  }

  getStatutReservationLibelle(statut: StatutReservation): string {
    switch (statut) {
      case StatutReservation.EN_ATTENTE: return 'En attente';
      case StatutReservation.CONFIRMEE:  return 'Confirmée';
      case StatutReservation.ANNULEE:    return 'Annulée';
      case StatutReservation.EXPIREE:    return 'Expirée';
      default: return 'Inconnu';
    }
  }

  fermerDetail(): void {
    this.afficherDetailTrajet = false;
    this.trajetVoir = null;
    this.reservationsDuTrajet = [];
    this.statsTrajet = null;
  }

  getStatutLibelle(statut: StatutTrajet): string {
    switch (statut) {
      case StatutTrajet.PROGRAMME: return 'Programmé';
      case StatutTrajet.EN_COURS: return 'En Cours';
      case StatutTrajet.TERMINE: return 'Terminé';
      case StatutTrajet.ANNULE: return 'Annulé';
      default: return 'Inconnu';
    }
  }

  getStatutClass(statut: StatutTrajet): string {
    switch (statut) {
      case StatutTrajet.PROGRAMME: return 'statut-programme';
      case StatutTrajet.EN_COURS: return 'statut-en-cours';
      case StatutTrajet.TERMINE: return 'statut-termine';
      case StatutTrajet.ANNULE: return 'statut-annule';
      default: return '';
    }
  }
}
