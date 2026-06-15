import { ChangeDetectorRef, Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reservations-recentes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reservations-recentes.html',
  styleUrl: './reservations-recentes.scss'
})
export class ReservationsRecentes implements OnInit, OnChanges {
  @Input() triggerRefresh: any;
  @Input() reservations: any[] = [];
  @Input() trajets: any[] = [];
  @Input() prochainsDeparts: any[] = [];          // nouveau
  @Input() placesDisponibles: { [id: string]: number } = {}; // nouveau

  dernieresReservations: any[] = [];
  isLoading: boolean = false;  // utilisé seulement pour les prochains départs si besoin

  constructor(private detection: ChangeDetectorRef) {}

  ngOnInit(): void {
    // Plus de chargement de formulaires
    this.calculerDernieresReservations();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['reservations'] || changes['triggerRefresh']) {
      this.calculerDernieresReservations();
    }
  }

  private calculerDernieresReservations(): void {
    if (!this.reservations) return;
    this.dernieresReservations = [...this.reservations]
      .sort((a, b) => new Date(b.dateReservation).getTime() - new Date(a.dateReservation).getTime())
      .slice(0, 5);
    this.detection.detectChanges();
  }

  getTrajetDescription(trajetId: string): string {
    const t = this.trajets?.find(tr => tr.id === trajetId);
    return t ? `${t.villeDepart?.nomVille || 'Départ'} → ${t.villeArrivee?.nomVille || 'Arrivée'}` : 'Trajet Inconnu';
  }

  getTarifTrajet(trajetId: string): number {
    const t = this.trajets?.find(tr => tr.id === trajetId);
    return t ? (t.tarif || 0) : 0;
  }

  // Pour les prochains départs, rien de plus, les données viennent du parent.
}