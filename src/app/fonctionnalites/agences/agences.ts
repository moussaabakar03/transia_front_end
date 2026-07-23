import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgenceService } from '../../core/services/agence.service';
import { VilleService } from '../../core/services/transport/ville-service';
import { CurrentUserService } from '../../core/services/current-user.service';
import { Agence, AgencePayload } from '../../shared/models/agence.model';
import { Ville } from '../../shared/models/ville';
import { Sidebar } from "../../shared/composants/sidebar/sidebar";
import { Header } from "../../shared/composants/header/header";

const FORM_VIDE: AgencePayload = {
  nom: '',
  villeId: '',
  adresse: '',
  telephone: '',
  email: '',
  latitude: undefined,
  longitude: undefined,
  photos: []
};

@Component({
  selector: 'app-agences',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar, Header],
  templateUrl: './agences.html',
  styleUrl: './agences.scss'
})
export class Agences implements OnInit {

  // Affichage paginé
  agencesAffichees: Agence[] = [];

  // États des modales
  afficherCreationAgence = false;
  afficherEditAgence = false;
  afficherDetailAgence = false;

  // Données éditées / en cours
  agenceEditer?: Agence;
  agenceVoir?: Agence;
  form: AgencePayload = { ...FORM_VIDE, photos: [] };

  // Saisie GPS assistée (formulaire création/édition)
  lienMapsColle = '';
  recherchePositionEnCours = false;

  // Carrousel photo de la modale détail
  photoActiveIndex = 0;

  // Pagination
  pageActuelle = 1;
  readonly parPage = 5;
  totalAgences = 0;

  // Recherche
  valeurSaisi = '';

  // Sources de données
  tousLesAgences: Agence[] = [];
  resultatsFiltres: Agence[] = [];

  villes: Ville[] = [];

  // Droits (cf. AgenceController : create/delete/statut réservés SUPER_ADMIN,
  // update ouvert à ADMIN_AGENCE mais uniquement sur sa propre agence)
  isSuperAdmin = false;
  agentAgenceId: string | null = null;

  constructor(
    private agenceService: AgenceService,
    private villeService: VilleService,
    private currentUser: CurrentUserService
  ) {}

  ngOnInit(): void {
    this.isSuperAdmin = this.currentUser.isSuperAdmin();
    this.agentAgenceId = this.currentUser.getAgenceId();
    this.load();
    this.loadVilles();
  }

  load(): void {
    this.agenceService.getAll().subscribe(data => {
      this.tousLesAgences = data;
      this.resultatsFiltres = [...data];
      this.totalAgences = this.resultatsFiltres.length;
      this.pageActuelle = 1;
      this.appliquerPage();
    });
  }

  loadVilles(): void {
    this.villeService.getAllVilles().subscribe(data => this.villes = data);
  }

  peutModifier(a: Agence): boolean {
    return this.isSuperAdmin || (this.agentAgenceId != null && a.id === this.agentAgenceId);
  }

  // Filtrage en temps réel par nom, ville ou téléphone
  filtrerAgences(): void {
    if (!this.valeurSaisi.trim()) {
      this.resultatsFiltres = [...this.tousLesAgences];
    } else {
      const terme = this.valeurSaisi.toLowerCase().trim();
      this.resultatsFiltres = this.tousLesAgences.filter(a =>
        a.nom.toLowerCase().includes(terme) ||
        (a.villeNom || '').toLowerCase().includes(terme) ||
        (a.telephone || '').toLowerCase().includes(terme)
      );
    }
    this.totalAgences = this.resultatsFiltres.length;
    this.pageActuelle = 1;
    this.appliquerPage();
  }

  private appliquerPage(): void {
    const debut = (this.pageActuelle - 1) * this.parPage;
    this.agencesAffichees = this.resultatsFiltres.slice(debut, debut + this.parPage);
  }

  get totalPages(): number {
    return Math.ceil(this.totalAgences / this.parPage);
  }

  pagePrecedente(): void {
    if (this.pageActuelle > 1) { this.pageActuelle--; this.appliquerPage(); }
  }

  pageSuivante(): void {
    if (this.pageActuelle < this.totalPages) { this.pageActuelle++; this.appliquerPage(); }
  }

  changerPage(p: number): void {
    this.pageActuelle = p;
    this.appliquerPage();
  }

  ouvrirCreation(): void {
    this.form = { ...FORM_VIDE, photos: [] };
    this.lienMapsColle = '';
    this.afficherCreationAgence = true;
  }

  // Extrait latitude/longitude d'un lien Google Maps collé (ou d'un simple "lat, lng").
  // Formats supportés : /@lat,lng,zoom, ?q=lat,lng, !3dlat!4dlng (liens "partager" d'un lieu), texte brut "lat, lng".
  // Les liens raccourcis (maps.app.goo.gl/...) ne peuvent pas être résolus côté navigateur (redirection bloquée) :
  // on demande alors à l'utilisateur d'utiliser le lien complet ou de saisir les coordonnées.
  appliquerLienMaps(): void {
    const lien = this.lienMapsColle.trim();
    if (!lien) return;

    const patterns = [
      /@(-?\d+\.\d+),\s*(-?\d+\.\d+)/,
      /[?&]q=(-?\d+\.\d+),\s*(-?\d+\.\d+)/,
      /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
      /^(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)$/
    ];

    for (const pattern of patterns) {
      const match = lien.match(pattern);
      if (match) {
        this.form.latitude = parseFloat(match[1]);
        this.form.longitude = parseFloat(match[2]);
        this.lienMapsColle = '';
        return;
      }
    }

    if (lien.includes('goo.gl') || lien.includes('maps.app')) {
      alert('Ce lien raccourci ne peut pas être analysé automatiquement. Ouvrez-le dans votre navigateur, copiez le lien complet depuis la barre d\'adresse, puis collez-le ici — ou saisissez directement les coordonnées.');
    } else {
      alert('Coordonnées introuvables dans ce lien. Vérifiez qu\'il s\'agit bien d\'un lien Google Maps, ou saisissez les coordonnées manuellement.');
    }
  }

  // Géolocalisation du navigateur : pratique quand l'admin saisit l'agence depuis place.
  utiliserPositionActuelle(): void {
    if (!navigator.geolocation) {
      alert('La géolocalisation n\'est pas disponible sur ce navigateur.');
      return;
    }
    this.recherchePositionEnCours = true;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.form.latitude = position.coords.latitude;
        this.form.longitude = position.coords.longitude;
        this.recherchePositionEnCours = false;
      },
      () => {
        this.recherchePositionEnCours = false;
        alert('Impossible d\'obtenir votre position (autorisation refusée ou signal indisponible).');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  soumettreCreation(): void {
    if (!this.validerFormulaire()) return;

    this.agenceService.create(this.form).subscribe({
      next: () => {
        this.afficherCreationAgence = false;
        this.load();
      },
      error: (err) => this.gererErreur(err, 'de la création')
    });
  }

  ouvrirEdit(a: Agence): void {
    this.agenceEditer = { ...a };
    this.form = {
      nom: a.nom,
      villeId: a.villeId,
      adresse: a.adresse,
      telephone: a.telephone,
      email: a.email,
      latitude: a.latitude,
      longitude: a.longitude,
      photos: [...(a.photos || [])]
    };
    this.lienMapsColle = '';
    this.afficherEditAgence = true;
  }

  soumettreModification(): void {
    if (!this.agenceEditer?.id || !this.validerFormulaire()) return;

    this.agenceService.update(this.agenceEditer.id, this.form).subscribe({
      next: () => {
        this.afficherEditAgence = false;
        this.agenceEditer = undefined;
        this.load();
      },
      error: (err) => this.gererErreur(err, 'de la modification')
    });
  }

  private validerFormulaire(): boolean {
    if (!this.form.nom || !this.form.villeId || !this.form.adresse ||
        !this.form.telephone || this.form.latitude == null || this.form.longitude == null) {
      alert('Nom, ville, adresse, téléphone et coordonnées GPS (latitude/longitude) sont obligatoires.');
      return false;
    }
    return true;
  }

  private gererErreur(err: any, contexte: string): void {
    console.error(`Erreur lors ${contexte} de l'agence`, err);
    alert(err.error?.message || `Impossible d'enregistrer cette agence.`);
  }

  supprimerAgence(id: string | undefined, nom: string): void {
    if (!id) return;
    if (confirm(`Voulez-vous vraiment supprimer l'agence ${nom} ?`)) {
      this.agenceService.delete(id).subscribe({
        next: () => this.load(),
        error: (err) => {
          console.error('Erreur lors de la suppression', err);
          const msg = err.error?.message || '';
          if (msg.includes('foreign key') || msg.includes('constraint') || msg.includes('lié') || msg.includes('référencé')) {
            alert('Impossible de supprimer cette agence car elle est liée à d\'autres données (utilisateurs, véhicules, trajets). Désactivez-la plutôt.');
          } else {
            alert(msg || 'Impossible de supprimer cette agence.');
          }
        }
      });
    }
  }

  toggleStatut(a: Agence): void {
    if (!a.id) return;
    const nouveauStatut = !a.statut;
    const action = nouveauStatut ? 'activer' : 'désactiver';
    if (!confirm(`Voulez-vous ${action} l'agence ${a.nom} ?`)) return;

    this.agenceService.updateStatut(a.id, nouveauStatut).subscribe({
      next: () => this.load(),
      error: (err) => {
        console.error('Erreur lors du changement de statut', err);
        alert(err.error?.message || 'Impossible de changer le statut de cette agence.');
      }
    });
  }

  ouvrirDetail(a: Agence): void {
    this.agenceVoir = a;
    this.photoActiveIndex = 0;
    this.afficherDetailAgence = true;
  }

  fermerDetail(): void {
    this.afficherDetailAgence = false;
    this.agenceVoir = undefined;
  }

  lienGoogleMaps(a: Agence): string | null {
    if (a.latitude == null || a.longitude == null) return null;
    return `https://www.google.com/maps?q=${a.latitude},${a.longitude}`;
  }

  photoSuivante(): void {
    const total = this.agenceVoir?.photos?.length || 0;
    if (total === 0) return;
    this.photoActiveIndex = (this.photoActiveIndex + 1) % total;
  }

  photoPrecedente(): void {
    const total = this.agenceVoir?.photos?.length || 0;
    if (total === 0) return;
    this.photoActiveIndex = (this.photoActiveIndex - 1 + total) % total;
  }

  allerAPhoto(index: number): void {
    this.photoActiveIndex = index;
  }

  // Galerie photos : conversion en base64 compressé (même logique que Vehicule.image),
  // chaque photo devient une ligne dans agence_photos côté backend.
  onPhotosSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    Array.from(input.files).forEach(file => {
      this.convertFileToBase64(file).then(base64 => {
        this.form.photos = [...(this.form.photos || []), base64];
      }).catch(err => console.error('Erreur lors du traitement de la photo', err));
    });

    input.value = '';
  }

  supprimerPhoto(index: number): void {
    this.form.photos = (this.form.photos || []).filter((_, i) => i !== index);
  }

  private convertFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          const maxSize = 600;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxSize) { height *= maxSize / width; width = maxSize; }
          } else {
            if (height > maxSize) { width *= maxSize / height; height = maxSize; }
          }

          canvas.width = width;
          canvas.height = height;
          ctx?.drawImage(img, 0, 0, width, height);

          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = reject;
        img.src = reader.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}
