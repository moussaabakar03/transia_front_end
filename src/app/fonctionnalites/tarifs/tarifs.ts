import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Sidebar } from '../../shared/composants/sidebar/sidebar';
import { Header } from '../../shared/composants/header/header';
import { TarifExpedition, TarifExpeditionRequest } from '../../shared/models/tarif-expedition.model';
import { TranchePoids } from '../../shared/models/colis.model';
import { Ville } from '../../shared/models/ville';
import { TarifExpeditionService } from '../../core/services/tarif-expedition.service';
import { VilleService } from '../../core/services/transport/ville-service';
import { CurrentUserService } from '../../core/services/current-user.service';

enum ModalMode {
  AJOUT = 'ajout',
  MODIFICATION = 'modification'
}

@Component({
  selector: 'app-tarifs',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar, Header],
  templateUrl: './tarifs.html',
  styleUrl: './tarifs.scss',
})
export class TarifsComponent implements OnInit {
  readonly ModalMode = ModalMode;
  readonly TranchePoids = TranchePoids;
  readonly tranches = Object.values(TranchePoids);

  tarifs: TarifExpedition[] = [];
  villes: Ville[] = [];

  isLoading = true;
  errorMessage = '';
  searchTerm = '';

  peutGerer = false;
  peutSupprimer = false;

  isModalOpen = false;
  isSubmitting = false;
  formError = '';
  modalMode: ModalMode = ModalMode.AJOUT;
  editingId: string | null = null;

  form: TarifExpeditionRequest = this.emptyForm();

  constructor(
    private tarifService: TarifExpeditionService,
    private villeService: VilleService,
    private currentUser: CurrentUserService,
  ) {}

  ngOnInit(): void {
    this.peutGerer = this.currentUser.isSuperAdmin() || this.currentUser.isAdminAgence();
    this.peutSupprimer = this.currentUser.isSuperAdmin();
    this.loadAll();
  }

  loadAll(): void {
    this.isLoading = true;
    forkJoin({
      tarifs: this.tarifService.getAll(),
      villes: this.villeService.getAllVilles(),
    }).subscribe({
      next: (r) => {
        this.tarifs = r.tarifs || [];
        this.villes = r.villes || [];
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Erreur lors du chargement des tarifs.';
        this.isLoading = false;
      }
    });
  }

  get filteredTarifs(): TarifExpedition[] {
    const term = this.searchTerm.toLowerCase();
    if (!term) return this.tarifs;
    return this.tarifs.filter(t =>
      t.villeDepartNom?.toLowerCase().includes(term) ||
      t.villeArriveeNom?.toLowerCase().includes(term)
    );
  }

  emptyForm(): TarifExpeditionRequest {
    return { villeDepartId: '', villeArriveeId: '', tranchePoids: TranchePoids.MOINS_DE_1KG, tarif: 0 };
  }

  openCreate(): void {
    this.modalMode = ModalMode.AJOUT;
    this.editingId = null;
    this.form = this.emptyForm();
    this.formError = '';
    this.isModalOpen = true;
  }

  openEdit(t: TarifExpedition): void {
    this.modalMode = ModalMode.MODIFICATION;
    this.editingId = t.id || null;
    this.form = {
      villeDepartId: t.villeDepartId,
      villeArriveeId: t.villeArriveeId,
      tranchePoids: t.tranchePoids,
      tarif: t.tarif,
    };
    this.formError = '';
    this.isModalOpen = true;
  }

  closeModal(): void {
    if (this.isSubmitting) return;
    this.isModalOpen = false;
  }

  submitForm(): void {
    if (!this.form.villeDepartId || !this.form.villeArriveeId) {
      this.formError = 'Sélectionnez les deux villes.';
      return;
    }
    if (this.form.villeDepartId === this.form.villeArriveeId) {
      this.formError = 'La ville de départ et la ville d\'arrivée doivent être différentes.';
      return;
    }
    if (!this.form.tarif || this.form.tarif <= 0) {
      this.formError = 'Le tarif doit être supérieur à 0.';
      return;
    }

    this.isSubmitting = true;
    this.formError = '';

    const obs = this.modalMode === ModalMode.AJOUT
      ? this.tarifService.create(this.form)
      : this.tarifService.update(this.editingId!, this.form);

    obs.subscribe({
      next: () => {
        this.isSubmitting = false;
        this.isModalOpen = false;
        this.loadAll();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.formError = err.error?.message || 'Erreur lors de l\'enregistrement.';
      }
    });
  }

  supprimer(t: TarifExpedition): void {
    if (!t.id || !confirm(`Supprimer le tarif ${t.villeDepartNom} → ${t.villeArriveeNom} (${this.getTrancheLabel(t.tranchePoids)}) ?`)) return;
    this.tarifService.delete(t.id).subscribe({
      next: () => this.loadAll(),
      error: () => alert('Erreur lors de la suppression.')
    });
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
}
