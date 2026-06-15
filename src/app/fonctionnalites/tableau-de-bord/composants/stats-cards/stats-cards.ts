import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stats-cards',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats-cards.html',
  styleUrl: './stats-cards.scss'
})
export class StatsCards implements OnInit, OnChanges {

  @Input() kpi: any = {
    tauxOccupation: 0,
    departsAujourdhui: 0,
    reservationsEnAttente: 0,
    revenusMois: 0
  };

  // Plus besoin de triggerRefresh pour charger les données enquêtes
  // On garde un flag de chargement si nécessaire (ici inutile car synchrone via @Input)
  isLoading = false;

  ngOnInit(): void {
    // rien à charger, les données viennent du parent
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Les KPIs sont déjà à jour via l'input
  }
}