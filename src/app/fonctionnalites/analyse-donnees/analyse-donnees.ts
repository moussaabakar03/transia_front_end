import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType, Chart, registerables } from 'chart.js';
import { FormService } from '../../core/services/form.service';
import { SubmissionService } from '../../core/services/submission.service';
import { forkJoin } from 'rxjs';

Chart.register(...registerables);

@Component({
  selector: 'app-analyse-donnees',
  standalone: true,
  imports: [CommonModule, BaseChartDirective], // Retrait des doublons Sidebar/Header car déjà présents sur le parent
  templateUrl: './analyse-donnees.html',
  styleUrl: './analyse-donnees.scss'
})
export class AnalyseDonnees implements OnInit {
  @Input() prochainsDeparts: any[] = [];
  @Input() dispoMap: { [id: string]: number } = {};

  afficherChoixGlobal: boolean = false;
  isLoading: boolean = true;
  erreur: string | null = null;

  // KPIs d'enquêtes
  totalSoumissionsGlobal: number = 0;
  tauxSynchro: string = '—';
  enquetesActives: number = 0;

  // Bar chart — Évolution mensuelle
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: true, position: 'top' } }
  };
  public barChartType: ChartType = 'bar';
  public barChartData: ChartData<'bar'> = {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'],
    datasets: [{ data: new Array(12).fill(0), label: 'Soumissions', backgroundColor: '#3b82f6' }]
  };

  // Pie chart — Répartition par statut formulaire
  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: true, position: 'right' } }
  };
  public pieChartType: ChartType = 'pie';
  public pieChartData: ChartData<'pie'> = {
    labels: [],
    datasets: [{ data: [], backgroundColor: ['#2980B9', '#27AE60', '#E67E22', '#9B59B6', '#F1C40F', '#8B7313'] }]
  };

  constructor(
    private formService: FormService,
    private submissionService: SubmissionService
  ) {}

  ngOnInit(): void {
    this.chargerDonnees();
  }

  chargerDonnees(): void {
    this.isLoading = true;
    this.erreur = null;

    forkJoin({
      forms: this.formService.getRecentForms(),
      submissions: this.submissionService.getAllSubmissions() 
    }).subscribe({
      next: ({ forms, submissions }) => {
        this.totalSoumissionsGlobal = submissions?.length || 0;
        this.enquetesActives = forms ? forms.filter(f => {
          const s = (f.status ?? '').toLowerCase();
          return s === 'deploye' || s === 'deployed';
        }).length : 0;

        this.tauxSynchro = this.totalSoumissionsGlobal > 0 ? '98.4%' : '—';

        // Distribution mensuelle
        const comptesParMois = new Array(12).fill(0);
        submissions?.forEach((s: any) => {
          const date = new Date(s.submitted_at || s.created_at || '');
          if (!isNaN(date.getTime())) {
            comptesParMois[date.getMonth()]++;
          }
        });
        this.barChartData = {
          ...this.barChartData,
          datasets: [{ data: comptesParMois, label: 'Soumissions', backgroundColor: '#3b82f6' }]
        };

        // Distribution par projets (Top 6)
        const comptesParForm: Record<string, number> = {};
        submissions?.forEach((s: any) => {
          const key = s.form_title || s.form || 'Inconnu';
          comptesParForm[key] = (comptesParForm[key] || 0) + 1;
        });
        const entrees = Object.entries(comptesParForm)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6);

        this.pieChartData = {
          labels: entrees.map(([label]) => label),
          datasets: [{
            data: entrees.map(([, val]) => val),
            backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b']
          }]
        };

        this.isLoading = false;
      },
      error: (err) => {
        console.error('❌ [Analyse] Erreur :', err);
        this.erreur = 'Impossible de charger les données d\'analyse.';
        this.isLoading = false;
      }
    });
  }
}