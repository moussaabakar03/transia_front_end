import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Sidebar } from '../../../shared/composants/sidebar/sidebar';
import { Header } from '../../../shared/composants/header/header';
import { Vehicule, VehiculePayload, StatutVehicule } from '../../../shared/models/vehicule';
import { VehiculeService } from '../../../core/services/transport/vehicule-service';

@Component({
  selector: 'app-vehicules',
  standalone: true,
  imports: [CommonModule, Sidebar, Header, FormsModule],
  templateUrl: './vehicules.html',
  styleUrl: './vehicules.scss',
})
export class Vehicules implements OnInit {
  // Affichage paginé
  vehiculesAffiches: Vehicule[] = [];

  // États des modales (ou formulaires d'action)
  afficherCreationVehicule: boolean = false;
  afficherEditVehicule: boolean = false;

  // Données éditées / en cours
  vehiculeEditer: Vehicule | null = null;
  nouveauVehicule: VehiculePayload = { 
    marque: '', 
    modele: '', 
    immatriculation: '', 
    capacite: 0, 
    capaciteSoute: 0,
    statut: StatutVehicule.DISPONIBLE,
    image: '',
    villeBaseId: '',
    villeActuelleId: ''
  };

  // Gestion des fichiers image
  selectedFile: File | null = null;
  imagePreview: string = '';

  // Pagination
  pageActuelle: number = 1;
  readonly parPage: number = 5;
  totalVehicules: number = 0;

  // Recherche
  valeurSaisi: string = '';

  // Sources de données
  tousLesVehicules: Vehicule[] = [];
  resultatsFiltres: Vehicule[] = [];

  // Enum pour le template
  StatutVehicule = StatutVehicule;

  constructor(private vehiculeService: VehiculeService) {}

  ngOnInit(): void {
    this.loadVehicules();
  }

  // Chargement initial depuis l'API
  loadVehicules(): void {
    this.vehiculeService.getAll().subscribe({
      next: (data) => {
        this.tousLesVehicules = data;
        this.resultatsFiltres = [...data];
        this.totalVehicules = this.resultatsFiltres.length;
        this.pageActuelle = 1;
        this.appliquerPage();
      },
      error: (err) => console.error('Erreur de chargement des véhicules', err)
    });
  }

  // Filtrage en temps réel par marque, modèle, immatriculation ou statut
  filtrerVehicules(): void {
    if (!this.valeurSaisi.trim()) {
      this.resultatsFiltres = [...this.tousLesVehicules];
    } else {
      const terme = this.valeurSaisi.toLowerCase().trim();
      this.resultatsFiltres = this.tousLesVehicules.filter(vehicule =>
        vehicule.marque.toLowerCase().includes(terme) ||
        vehicule.modele.toLowerCase().includes(terme) ||
        vehicule.immatriculation.toLowerCase().includes(terme) ||
        vehicule.statut.toLowerCase().includes(terme)
      );
    }
    this.totalVehicules = this.resultatsFiltres.length;
    this.pageActuelle = 1;
    this.appliquerPage();
  }

  // Appliquer la pagination sur les résultats filtrés
  private appliquerPage(): void {
    const debut = (this.pageActuelle - 1) * this.parPage;
    this.vehiculesAffiches = this.resultatsFiltres.slice(debut, debut + this.parPage);
  }

  // Calcul du nombre total de pages
  get totalPages(): number {
    return Math.ceil(this.totalVehicules / this.parPage);
  }

  // Navigation de pagination
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

  // Suppression d'un véhicule avec confirmation
  supprimerVehicule(id: string | undefined, immatriculation: string): void {
    if (!id) return;
    
    if (confirm(`Voulez-vous vraiment supprimer le véhicule ${immatriculation} ?`)) {
      this.vehiculeService.delete(id).subscribe({
        next: () => {
          alert(`Le véhicule ${immatriculation} a été supprimé.`);
          this.loadVehicules();
        },
        error: (err) => {
          console.error('Erreur lors de la suppression', err);
          const errorMsg = err.error?.message || err.error || 'Impossible de supprimer ce véhicule.';
          
          // Check if it's a foreign key constraint error
          if (errorMsg.includes('foreign key') || errorMsg.includes('constraint') || errorMsg.includes('lié') || errorMsg.includes('référencé')) {
            alert('Impossible de supprimer ce véhicule car il est lié à d\'autres données (trajets, réservations, etc.). Veuillez d\'abord supprimer ou modifier ces données avant de supprimer le véhicule.');
          } else {
            alert(errorMsg);
          }
        }
      });
    }
  }

  // Actions de création
  ouvrirCreation(): void {
    this.nouveauVehicule = { 
      marque: '', 
      modele: '', 
      immatriculation: '', 
      capacite: 0, 
      capaciteSoute: 0,
      statut: StatutVehicule.DISPONIBLE,
      image: '',
      villeBaseId: '',
      villeActuelleId: ''
    };
    this.selectedFile = null;
    this.imagePreview = '';
    this.afficherCreationVehicule = true;
  }

  // Gestion du fichier image
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      
      // Créer un aperçu de l'image
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.imagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  // Convertir le fichier en base64 pour l'envoi avec compression
  private convertFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Redimensionner l'image à max 300x300 pour réduire la taille
          const maxSize = 300;
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > maxSize) {
              height *= maxSize / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width *= maxSize / height;
              height = maxSize;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Compresser avec qualité 0.7
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          resolve(compressedBase64);
        };
        img.onerror = reject;
        img.src = reader.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  soumettreCreation(): void {
    if (!this.nouveauVehicule.marque || !this.nouveauVehicule.modele || 
        !this.nouveauVehicule.immatriculation || this.nouveauVehicule.capacite <= 0) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    // Si un fichier est sélectionné, le convertir en base64
    if (this.selectedFile) {
      this.convertFileToBase64(this.selectedFile).then(base64Image => {
        this.nouveauVehicule.image = base64Image;
        this.createVehicule();
      }).catch(err => {
        console.error('Erreur lors de la conversion de l\'image', err);
        alert('Erreur lors du traitement de l\'image.');
      });
    } else {
      this.createVehicule();
    }
  }

  private createVehicule(): void {
    this.vehiculeService.create(this.nouveauVehicule).subscribe({
      next: () => {
        this.afficherCreationVehicule = false;
        this.loadVehicules();
      },
      error: (err) => console.error('Erreur lors de la création', err)
    });
  }

  // Actions d'édition
  ouvrirEdit(vehicule: Vehicule): void {
    this.vehiculeEditer = { ...vehicule };
    this.selectedFile = null;
    this.imagePreview = vehicule.image || '';
    this.afficherEditVehicule = true;
  }

  soumettreModification(): void {
    if (!this.vehiculeEditer || !this.vehiculeEditer.id ||
        !this.vehiculeEditer.marque || !this.vehiculeEditer.modele ||
        !this.vehiculeEditer.immatriculation || this.vehiculeEditer.capacite <= 0) return;

    // Si un fichier est sélectionné, le convertir en base64
    if (this.selectedFile) {
      this.convertFileToBase64(this.selectedFile).then(base64Image => {
        if (this.vehiculeEditer) {
          this.vehiculeEditer.image = base64Image;
          this.updateVehicule();
        }
      }).catch(err => {
        console.error('Erreur lors de la conversion de l\'image', err);
        alert('Erreur lors du traitement de l\'image.');
      });
    } else {
      this.updateVehicule();
    }
  }

  private updateVehicule(): void {
    if (!this.vehiculeEditer || !this.vehiculeEditer.id) return;

    const payload: VehiculePayload = {
      marque: this.vehiculeEditer.marque,
      modele: this.vehiculeEditer.modele,
      immatriculation: this.vehiculeEditer.immatriculation,
      capacite: this.vehiculeEditer.capacite,
      capaciteSoute: this.vehiculeEditer.capaciteSoute,
      statut: this.vehiculeEditer.statut,
      image: this.vehiculeEditer.image || '',
      villeBaseId: this.vehiculeEditer.villeBaseId,
      villeActuelleId: this.vehiculeEditer.villeActuelleId
    };

    this.vehiculeService.update(this.vehiculeEditer.id, payload).subscribe({
      next: () => {
        this.afficherEditVehicule = false;
        this.vehiculeEditer = null;
        this.loadVehicules();
      },
      error: (err) => console.error('Erreur lors de la modification', err)
    });
  }

  // Helper pour obtenir le libellé du statut
  getStatutLibelle(statut: StatutVehicule): string {
    switch (statut) {
      case StatutVehicule.DISPONIBLE: return 'Disponible';
      case StatutVehicule.EN_ROUTE: return 'En Router';
      case StatutVehicule.EN_MAINTENANCE: return 'En Maintenance';
      case StatutVehicule.HORS_SERVICE: return 'Hors service';
      default: return 'Inconnu';
    }
  }

  // Helper pour obtenir la classe CSS du statut
  getStatutClass(statut: StatutVehicule): string {
    switch (statut) {
      case StatutVehicule.DISPONIBLE: return 'statut-disponible';
      case StatutVehicule.EN_ROUTE: return 'statut-en-route';
      case StatutVehicule.EN_MAINTENANCE: return 'statut-maintenance';
      case StatutVehicule.HORS_SERVICE: return 'statut-hors-service';
      default: return '';
    }
  }
}
