import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ColisService } from '../../core/services/colis.service';

@Component({
  selector: 'app-suivi-colis',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './suivi-colis.html',
  styleUrl: './suivi-colis.scss'
})
export class SuiviColisComponent implements OnInit {
  numeroSuiviSaisi: string = '';
  colis: any = null;
  isLoading: boolean = false;
  erreur: string = '';
  currentYear: number = new Date().getFullYear();

  steps = [
    { key: 'DEPOSE_EN_AGENCE', label: 'Déposé en agence', icon: 'inventory_2' },
    { key: 'EN_TRANSIT', label: 'En transit', icon: 'directions_bus' },
    { key: 'ARRIVE_EN_AGENCE', label: 'Arrivé à destination', icon: 'storefront' },
    { key: 'LIVRE', label: 'Livré', icon: 'check_circle' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private colisService: ColisService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const num = params['numeroSuivi'];
      if (num) {
        this.numeroSuiviSaisi = num;
        this.chargerSuivi(num);
      }
    });
  }

  rechercher(): void {
    const num = this.numeroSuiviSaisi.trim();
    if (!num) return;
    this.router.navigate(['/suivi', num]);
  }

  chargerSuivi(num: string): void {
    this.isLoading = true;
    this.erreur = '';
    this.colis = null;

    this.colisService.getByNumeroSuivi(num).subscribe({
      next: (data) => {
        this.colis = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du suivi :', err);
        this.erreur = 'Aucun colis trouvé avec le numéro de suivi "' + num + '". Vérifiez la référence et réessayez.';
        this.isLoading = false;
      }
    });
  }

  getStepIndex(statut: string): number {
    switch (statut) {
      case 'EN_ATTENTE_DEPOT':
      case 'DEPOSE_EN_AGENCE':
        return 0;
      case 'EN_TRANSIT':
        return 1;
      case 'ARRIVE_EN_AGENCE':
      case 'EN_COURS_LIVRAISON':
        return 2;
      case 'LIVRE':
        return 3;
      default:
        return 0;
    }
  }

  isStepCompleted(stepIndex: number): boolean {
    if (!this.colis) return false;
    const currentIndex = this.getStepIndex(this.colis.statut);
    return stepIndex <= currentIndex;
  }

  isStepActive(stepIndex: number): boolean {
    if (!this.colis) return false;
    return stepIndex === this.getStepIndex(this.colis.statut);
  }

  getStatutBadgeClass(statut: string): string {
    switch (statut) {
      case 'DEPOSE_EN_AGENCE':
      case 'EN_ATTENTE_DEPOT':
        return 'statut-depose';
      case 'EN_TRANSIT':
        return 'statut-transit';
      case 'ARRIVE_EN_AGENCE':
      case 'EN_COURS_LIVRAISON':
        return 'statut-arrive';
      case 'LIVRE':
        return 'statut-livre';
      case 'ANNULE':
      case 'PERDU':
        return 'statut-erreur';
      default:
        return 'statut-default';
    }
  }

  getStatutLibelle(statut: string): string {
    switch (statut) {
      case 'EN_ATTENTE_DEPOT': return 'En attente de dépôt';
      case 'DEPOSE_EN_AGENCE': return 'Déposé en agence';
      case 'EN_TRANSIT': return 'En cours d\'acheminement (Transit)';
      case 'ARRIVE_EN_AGENCE': return 'Arrivé à l\'agence destination';
      case 'EN_COURS_LIVRAISON': return 'En cours de livraison à domicile';
      case 'LIVRE': return 'Livré au destinataire';
      case 'EN_ATTENTE_RETOUR': return 'En attente de retour';
      case 'RETOURNE': return 'Retourné à l\'expéditeur';
      case 'ANNULE': return 'Colis Annulé';
      default: return statut || 'Inconnu';
    }
  }

  getQrUrl(data: string): string {
    if (!data) return '';
    const targetUrl = data.startsWith('http') ? data : `http://localhost:4200/suivi/${data}`;
    return 'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=' + encodeURIComponent(targetUrl);
  }
}
