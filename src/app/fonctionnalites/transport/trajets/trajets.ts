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
import { AgenceService } from '../../../core/services/agence.service';
import { Agence } from '../../../shared/models/agence.model';
import { Ville } from '../../../shared/models/ville';
import { Vehicule } from '../../../shared/models/vehicule';
import { Reservation, StatutReservation } from '../../../shared/models/reservation.model';
import { ReservationService } from '../../../core/services/reservation-service';
import { ColisService } from '../../../core/services/colis.service';
import { Colis } from '../../../shared/models/colis.model';

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
  trajetEditer: any = null;
  trajetVoir: Trajet | null = null;

  // Réservations & Colis liés au trajet consulté (modale détail)
  reservationsDuTrajet: Reservation[] = [];
  chargementReservationsTrajet = false;
  colisDuTrajet: Colis[] = [];
  chargementColisTrajet = false;
  poidsTotalColis = 0;
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
    agenceDepartId: '',
    agenceArriveeId: '',
    vehiculeId: '',
    chauffeurId: null,
    distance: 0,
    dureeEstimee: '',
    tarif: 0,
    dateDepart: '',
    heureDepart: '',
    statut: StatutTrajet.PROGRAMME
  };
  dateAujourdhui: string = new Date().toISOString().split('T')[0];

  // Pagination
  pageActuelle: number = 1;
  readonly parPage: number = 5;
  totalTrajets: number = 0;

  // Recherche & Filtres
  valeurSaisi: string = '';
  statutFilter: string = 'TOUS';
  triOrdre: 'DESC' | 'ASC' = 'DESC';

  // Sources de données
  tousLesTrajets: Trajet[] = [];
  resultatsFiltres: Trajet[] = [];

  // Listes pour les select dropdowns
  villes: Ville[] = [];
  agences: Agence[] = [];
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
    private agenceService:       AgenceService,
    private vehiculeService:     VehiculeService,
    private userService:         UserService,
    private currentUser:         CurrentUserService,
    private reservationService:  ReservationService,
    private colisService:        ColisService
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
    this.loadAgences();
    this.loadVehicules();
    this.loadChauffeurs();
  }

  loadAgences(): void {
    this.agenceService.getAll().subscribe({
      next: (data) => {
        this.agences = data;
      },
      error: (err) => console.error('Erreur de chargement des agences', err)
    });
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

  // Lorsqu'on change la ville de départ, on recharge si besoin les chauffeurs sans bloquer l'accès aux autres chauffeurs
  onVilleDepartChange(villeId: string, cible: { chauffeurId?: string | null }): void {
    // conserver la possibilité de sélectionner tous les chauffeurs
  }

  loadTrajets(): void {
    this.trajetService.getAll().subscribe({
      next: (data) => {
        const visibles = this.isAdmin
          ? data
          : data.filter(t => this.agentAgenceId != null && t.agenceId === this.agentAgenceId);
        this.tousLesTrajets = visibles;
        this.filtrerTrajets();
      },
      error: (err) => console.error('Erreur de chargement des trajets', err)
    });
  }

  private getTrajetTimestamp(t: Trajet): number {
    if (!t.dateDepart) return 0;
    const timeStr = t.heureDepart ? `${t.dateDepart}T${t.heureDepart}` : t.dateDepart;
    const time = new Date(timeStr).getTime();
    return isNaN(time) ? 0 : time;
  }

  // Filtrage et tri en temps réel
  filtrerTrajets(): void {
    const terme = this.valeurSaisi.toLowerCase().trim();

    this.resultatsFiltres = this.tousLesTrajets.filter(trajet => {
      // 1. Filtrage par statut
      if (this.statutFilter !== 'TOUS' && trajet.statut !== this.statutFilter) {
        return false;
      }

      // 2. Filtrage par terme de recherche
      if (!terme) return true;
      return (
        trajet.villeDepart?.nomVille?.toLowerCase().includes(terme) ||
        trajet.villeArrivee?.nomVille?.toLowerCase().includes(terme) ||
        trajet.agenceDepartNom?.toLowerCase().includes(terme) ||
        trajet.agenceArriveeNom?.toLowerCase().includes(terme) ||
        trajet.vehicule?.immatriculation?.toLowerCase().includes(terme) ||
        trajet.chauffeurNom?.toLowerCase().includes(terme) ||
        (trajet.id && trajet.id.toLowerCase().includes(terme))
      );
    });

    // 3. Tri par date et heure de départ (ordre configurable, DESC par défaut)
    this.resultatsFiltres.sort((a, b) => {
      const timeA = this.getTrajetTimestamp(a);
      const timeB = this.getTrajetTimestamp(b);
      return this.triOrdre === 'DESC' ? timeB - timeA : timeA - timeB;
    });

    this.totalTrajets = this.resultatsFiltres.length;
    this.pageActuelle = 1;
    this.appliquerPage();
  }

  toggleTriDate(): void {
    this.triOrdre = this.triOrdre === 'DESC' ? 'ASC' : 'DESC';
    this.filtrerTrajets();
  }

  // Appliquer la pagination
  private appliquerPage(): void {
    const debut = (this.pageActuelle - 1) * this.parPage;
    this.trajetsAffiches = this.resultatsFiltres.slice(debut, debut + this.parPage);
  }

  get totalPages(): number {
    return Math.ceil(this.totalTrajets / this.parPage) || 1;
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

  changerPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.pageActuelle = page;
    this.appliquerPage();
  }

  getPaginationPages(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    
    if (this.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, this.pageActuelle - Math.floor(maxVisiblePages / 2));
      const endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
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
      agenceDepartId: this.agentAgenceId ?? '',
      agenceArriveeId: '',
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

  getAgencesPourVille(villeId?: string): Agence[] {
    if (!villeId) return this.agences;
    return this.agences.filter(a => a.villeId === villeId);
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

    // Validation : date de départ ne doit pas être dans le passé
    if (this.nouveauTrajet.dateDepart < this.dateAujourdhui) {
      alert('La date de départ ne peut pas être antérieure à la date d\'aujourd\'hui.');
      return;
    }

    // Validation : conflits d'emploi du temps pour le véhicule et le chauffeur à la même date
    if (this.nouveauTrajet.vehiculeId && this.nouveauTrajet.dateDepart) {
      const conflitVehicule = this.tousLesTrajets.find(t =>
        t.vehicule?.id === this.nouveauTrajet.vehiculeId &&
        t.dateDepart === this.nouveauTrajet.dateDepart &&
        (t.statut === StatutTrajet.PROGRAMME || t.statut === StatutTrajet.EN_COURS)
      );
      if (conflitVehicule) {
        const confDept = conflitVehicule.villeDepart?.nomVille || '...';
        const confArr = conflitVehicule.villeArrivee?.nomVille || '...';
        alert(`Attention : Le véhicule sélectionné est déjà planifié le ${this.nouveauTrajet.dateDepart} sur le trajet ${confDept} → ${confArr} (${conflitVehicule.heureDepart}).`);
        return;
      }
    }

    if (this.nouveauTrajet.chauffeurId && this.nouveauTrajet.dateDepart) {
      const conflitChauffeur = this.tousLesTrajets.find(t =>
        t.chauffeurId === this.nouveauTrajet.chauffeurId &&
        t.dateDepart === this.nouveauTrajet.dateDepart &&
        (t.statut === StatutTrajet.PROGRAMME || t.statut === StatutTrajet.EN_COURS)
      );
      if (conflitChauffeur) {
        const confDept = conflitChauffeur.villeDepart?.nomVille || '...';
        const confArr = conflitChauffeur.villeArrivee?.nomVille || '...';
        alert(`Attention : Le chauffeur sélectionné est déjà planifié le ${this.nouveauTrajet.dateDepart} sur le trajet ${confDept} → ${confArr} (${conflitChauffeur.heureDepart}).`);
        return;
      }
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
    this.trajetEditer = {
      ...trajet,
      agenceDepartId: trajet.agenceDepartId || trajet.agenceDepart?.id || trajet.agenceId || '',
      agenceArriveeId: trajet.agenceArriveeId || trajet.agenceArrivee?.id || ''
    };
    this.afficherEditTrajet = true;
  }

  soumettreModification(): void {
    if (!this.trajetEditer || !this.trajetEditer.id) return;

    const payload = {
      villeDepartId: this.trajetEditer.villeDepart?.id,
      villeArriveeId: this.trajetEditer.villeArrivee?.id,
      agenceDepartId: this.trajetEditer.agenceDepartId || this.trajetEditer.agenceId,
      agenceArriveeId: this.trajetEditer.agenceArriveeId,
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

    // Validation : conflits d'emploi du temps lors de la modification
    if (payload.vehiculeId && payload.dateDepart) {
      const conflitVehicule = this.tousLesTrajets.find(t =>
        t.id !== this.trajetEditer?.id &&
        t.vehicule?.id === payload.vehiculeId &&
        t.dateDepart === payload.dateDepart &&
        (t.statut === StatutTrajet.PROGRAMME || t.statut === StatutTrajet.EN_COURS)
      );
      if (conflitVehicule) {
        const confDept = conflitVehicule.villeDepart?.nomVille || '...';
        const confArr = conflitVehicule.villeArrivee?.nomVille || '...';
        alert(`Attention : Le véhicule sélectionné est déjà planifié le ${payload.dateDepart} sur le trajet ${confDept} → ${confArr} (${conflitVehicule.heureDepart}).`);
        return;
      }
    }

    if (payload.chauffeurId && payload.dateDepart) {
      const conflitChauffeur = this.tousLesTrajets.find(t =>
        t.id !== this.trajetEditer?.id &&
        t.chauffeurId === payload.chauffeurId &&
        t.dateDepart === payload.dateDepart &&
        (t.statut === StatutTrajet.PROGRAMME || t.statut === StatutTrajet.EN_COURS)
      );
      if (conflitChauffeur) {
        const confDept = conflitChauffeur.villeDepart?.nomVille || '...';
        const confArr = conflitChauffeur.villeArrivee?.nomVille || '...';
        alert(`Attention : Le chauffeur sélectionné est déjà planifié le ${payload.dateDepart} sur le trajet ${confDept} → ${confArr} (${conflitChauffeur.heureDepart}).`);
        return;
      }
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

  // Voir le détail d'un trajet, avec ses réservations et la liste des colis à bord
  ouvrirDetail(trajet: Trajet): void {
    this.trajetVoir = trajet;
    this.afficherDetailTrajet = true;
    this.reservationsDuTrajet = [];
    this.colisDuTrajet = [];
    this.poidsTotalColis = 0;
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

    this.chargementColisTrajet = true;
    this.colisService.getByTrajet(trajet.id).subscribe({
      next: (colisList) => {
        this.colisDuTrajet = colisList || [];
        this.poidsTotalColis = this.colisDuTrajet.reduce((sum, c) => sum + (c.poidsReel || 0), 0);
        this.chargementColisTrajet = false;
      },
      error: (err) => {
        console.error('Erreur de chargement des colis du trajet', err);
        this.chargementColisTrajet = false;
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
      case StatutTrajet.EXPIRE: return 'Expiré';
      default: return 'Inconnu';
    }
  }

  getStatutClass(statut: StatutTrajet): string {
    switch (statut) {
      case StatutTrajet.PROGRAMME: return 'statut-programme';
      case StatutTrajet.EN_COURS: return 'statut-en-cours';
      case StatutTrajet.TERMINE: return 'statut-termine';
      case StatutTrajet.ANNULE: return 'statut-annule';
      case StatutTrajet.EXPIRE: return 'statut-expire';
      default: return '';
    }
  }

  // --- Helpers pour l'affichage enrichi et le tri des Véhicules & Chauffeurs ---

  formatDateCompact(dateStr?: string, timeStr?: string): string {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : dateStr;
    const formattedTime = timeStr ? ` à ${timeStr.substring(0, 5)}` : '';
    return `${formattedDate}${formattedTime}`;
  }

  getProchainTrajetVehicule(vehiculeId?: string, excludeTrajetId?: string): Trajet | null {
    if (!vehiculeId) return null;
    const aujourdhui = this.dateAujourdhui;
    const prochains = this.tousLesTrajets.filter(t => 
      t.vehicule?.id === vehiculeId &&
      (!excludeTrajetId || t.id !== excludeTrajetId) &&
      (t.statut === StatutTrajet.PROGRAMME || t.statut === StatutTrajet.EN_COURS) &&
      t.dateDepart >= aujourdhui
    );
    if (prochains.length === 0) return null;
    prochains.sort((a, b) => {
      if (a.statut === StatutTrajet.EN_COURS && b.statut !== StatutTrajet.EN_COURS) return -1;
      if (b.statut === StatutTrajet.EN_COURS && a.statut !== StatutTrajet.EN_COURS) return 1;
      const dateA = `${a.dateDepart}T${a.heureDepart || '00:00'}`;
      const dateB = `${b.dateDepart}T${b.heureDepart || '00:00'}`;
      return dateA.localeCompare(dateB);
    });
    return prochains[0];
  }

  getVehiculeOptionLabel(vehicule: Vehicule, excludeTrajetId?: string): string {
    const baseLabel = `${vehicule.marque || ''} ${vehicule.modele || ''} (${vehicule.immatriculation})`;
    const trajet = this.getProchainTrajetVehicule(vehicule.id, excludeTrajetId);
    if (!trajet) {
      return `${baseLabel} • [Disponible]`;
    }
    const statutTxt = trajet.statut === StatutTrajet.EN_COURS ? 'En trajet' : 'Planifié';
    const dept = trajet.villeDepart?.nomVille || '...';
    const arr = trajet.villeArrivee?.nomVille || '...';
    const dt = this.formatDateCompact(trajet.dateDepart, trajet.heureDepart);
    return `${baseLabel} • [${statutTxt}: ${dept} → ${arr} ${dt}]`;
  }

  getVehiculesDisponiblesEtTries(excludeTrajetId?: string): Vehicule[] {
    const utilisables = this.vehicules.filter(v => {
      const st = (v.statut || '').toString().toUpperCase();
      return st !== 'HORS_SERVICE' && st !== 'EN_MAINTENANCE' && st !== 'EN_PANNE';
    });
    return [...utilisables].sort((a, b) => {
      const trA = this.getProchainTrajetVehicule(a.id, excludeTrajetId);
      const trB = this.getProchainTrajetVehicule(b.id, excludeTrajetId);
      if (!trA && trB) return -1;
      if (trA && !trB) return 1;
      if (!trA && !trB) return (a.immatriculation || '').localeCompare(b.immatriculation || '');
      const dateA = `${trA!.dateDepart}T${trA!.heureDepart || '00:00'}`;
      const dateB = `${trB!.dateDepart}T${trB!.heureDepart || '00:00'}`;
      return dateA.localeCompare(dateB);
    });
  }

  getProchainTrajetChauffeur(chauffeurId?: string, excludeTrajetId?: string): Trajet | null {
    if (!chauffeurId) return null;
    const aujourdhui = this.dateAujourdhui;
    const prochains = this.tousLesTrajets.filter(t => 
      (t.chauffeurId === chauffeurId) &&
      (!excludeTrajetId || t.id !== excludeTrajetId) &&
      (t.statut === StatutTrajet.PROGRAMME || t.statut === StatutTrajet.EN_COURS) &&
      t.dateDepart >= aujourdhui
    );
    if (prochains.length === 0) return null;
    prochains.sort((a, b) => {
      if (a.statut === StatutTrajet.EN_COURS && b.statut !== StatutTrajet.EN_COURS) return -1;
      if (b.statut === StatutTrajet.EN_COURS && a.statut !== StatutTrajet.EN_COURS) return 1;
      const dateA = `${a.dateDepart}T${a.heureDepart || '00:00'}`;
      const dateB = `${b.dateDepart}T${b.heureDepart || '00:00'}`;
      return dateA.localeCompare(dateB);
    });
    return prochains[0];
  }

  getChauffeurOptionLabel(chauffeur: any, excludeTrajetId?: string): string {
    const nom = chauffeur.fullName || chauffeur.name || chauffeur.telephone || 'Chauffeur';
    const tel = chauffeur.telephone ? ` (${chauffeur.telephone})` : '';
    const ville = chauffeur.villeNom ? ` [${chauffeur.villeNom}]` : '';
    const baseLabel = `${nom}${tel}${ville}`;

    const id = chauffeur.publicId || chauffeur.id;
    const trajet = this.getProchainTrajetChauffeur(id, excludeTrajetId);
    if (!trajet) {
      return `${baseLabel} • [Disponible]`;
    }
    const statutTxt = trajet.statut === StatutTrajet.EN_COURS ? 'En trajet' : 'Planifié';
    const dept = trajet.villeDepart?.nomVille || '...';
    const arr = trajet.villeArrivee?.nomVille || '...';
    const dt = this.formatDateCompact(trajet.dateDepart, trajet.heureDepart);
    return `${baseLabel} • [${statutTxt}: ${dept} → ${arr} ${dt}]`;
  }

  getChauffeursTries(excludeTrajetId?: string): any[] {
    return [...this.chauffeurs].sort((a, b) => {
      const idA = a.publicId || a.id;
      const idB = b.publicId || b.id;
      const trA = this.getProchainTrajetChauffeur(idA, excludeTrajetId);
      const trB = this.getProchainTrajetChauffeur(idB, excludeTrajetId);
      if (!trA && trB) return -1;
      if (trA && !trB) return 1;
      if (!trA && !trB) {
        const nomA = a.fullName || a.name || '';
        const nomB = b.fullName || b.name || '';
        return nomA.localeCompare(nomB);
      }
      const dateA = `${trA!.dateDepart}T${trA!.heureDepart || '00:00'}`;
      const dateB = `${trB!.dateDepart}T${trB!.heureDepart || '00:00'}`;
      return dateA.localeCompare(dateB);
    });
  }
}
