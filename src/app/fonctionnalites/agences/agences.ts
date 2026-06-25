import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgenceService } from '../../core/services/agence.service';
import { VilleService } from '../../core/services/transport/ville-service';
import { Agence, AgencePayload } from '../../shared/models/agence.model';
import { Ville } from '../../shared/models/ville';
import { Sidebar } from "../../shared/composants/sidebar/sidebar";
import { Header } from "../../shared/composants/header/header";

@Component({
  selector: 'app-agences',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar, Header],
  templateUrl: './agences.html',
  styleUrl: './agences.scss'
})
export class Agences implements OnInit {

  agences: Agence[] = [];
  villes: Ville[] = [];
  showForm = false;
  editMode = false;
  selectedId?: string;

  form: AgencePayload = {
    nom: '',
    villeId: '',
    adresse: '',
    telephone: '',
    email: '',
    latitude: undefined,
    longitude: undefined
  };

  constructor(
    private agenceService: AgenceService,
    private villeService: VilleService
  ) {}

  ngOnInit(): void {
    this.load();
    this.loadVilles();
  }

  load(): void {
    this.agenceService.getAll().subscribe(data => this.agences = data);
  }

  loadVilles(): void {
    this.villeService.getAllVilles().subscribe(data => this.villes = data);
  }

  openCreate(): void {
    this.editMode = false;
    this.selectedId = undefined;
    this.form = { nom: '', villeId: '', adresse: '', telephone: '', email: '' };
    this.showForm = true;
  }

  openEdit(a: Agence): void {
    this.editMode = true;
    this.selectedId = a.id;
    this.form = {
      nom: a.nom,
      villeId: a.villeId,
      adresse: a.adresse,
      telephone: a.telephone,
      email: a.email,
      latitude: a.latitude,
      longitude: a.longitude
    };
    this.showForm = true;
  }

  save(): void {
    if (this.editMode && this.selectedId) {
      this.agenceService.update(this.selectedId, this.form).subscribe(() => {
        this.load();
        this.showForm = false;
      });
    } else {
      this.agenceService.create(this.form).subscribe(() => {
        this.load();
        this.showForm = false;
      });
    }
  }

  delete(id: string): void {
    if (confirm('Supprimer cette agence ?')) {
      this.agenceService.delete(id).subscribe(() => this.load());
    }
  }

  cancel(): void {
    this.showForm = false;
  }

  ouvrirCreation(): void {
    this.openCreate();
  }
}
