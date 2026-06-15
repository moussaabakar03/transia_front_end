// import { Component, OnInit } from '@angular/core';
// import { CommonModule, Location } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { ActivatedRoute, Router } from '@angular/router';
// import { HttpClient, HttpHeaders } from '@angular/common/http';
// import { Sidebar } from '../../shared/composants/sidebar/sidebar';
// import { Header } from '../../shared/composants/header/header';

// import { environment } from '../../../environments/environment.development';

// interface Reponse {
//   field_id: string;
//   field_label: string;
//   field_type: string;
//   value: string;
// }

// interface Soumission {
//   id: string;
//   submitted_by_username: string | null;
//   submitted_at: string;
//   status: string;
//   gps_latitude: number | null;
//   gps_longitude: number | null;
//   gps_accuracy: number | null;
//   answers: any[];
//   reponsesFormatees?: Reponse[];
//   expanded?: boolean;
// }

// @Component({
//   selector: 'app-soumissions',
//   standalone: true,
//   imports: [CommonModule, FormsModule, Sidebar, Header],
//   templateUrl: './soumissions.html',
//   styleUrl: './soumissions.scss'
// })
// export class Soumissions implements OnInit {

//   idFormulaire!: string;
//   titreFormulaire = '';
//   questions: any[] = [];
//   soumissions: Soumission[] = [];
//   soumissionsAffichees: Soumission[] = [];

//   isLoading = true;
//   erreur: string | null = null;

//   // Pagination
//   pageActuelle = 1;
//   readonly parPage = 10;
//   totalSoumissions = 0;

//   // Filtres
//   recherche = '';
//   filtreStatut = 'tous';

//   private baseUrl = environment.baseUrl;

//   constructor(
//     private route: ActivatedRoute,
//     private router: Router,
//     private http: HttpClient,
//     private location: Location
//   ) {}
  
//   ngOnInit(): void {
//     this.idFormulaire = this.route.snapshot.paramMap.get('id') || '';
//     if (!this.idFormulaire) {
//       this.erreur = 'ID formulaire introuvable.';
//       this.isLoading = false;
//       return;
//     }
//     this.chargerDonnees();
//   }

//   chargerDonnees(): void {
//     this.isLoading = true;

//     this.http.get<any>(`${this.baseUrl}/forms/forms/${this.idFormulaire}/`).subscribe({
//       next: (form) => {
//         this.titreFormulaire = form.title;
//         this.questions = form.questions || [];
//         this.chargerSoumissions();
//       },
//       error: () => {
//         this.erreur = 'Impossible de charger le formulaire.';
//         this.isLoading = false;
//       }
//     });
//   }

//   chargerSoumissions(): void {
//     this.http.get<any[]>(`${this.baseUrl}/submissions/submissions/?form=${this.idFormulaire}`).subscribe({
//       next: (data) => {
//         console.log('📋 Toutes les soumissions reçues :', JSON.stringify(data));
//         this.soumissions = data
//           .filter(s => s.status === 'submitted')
//           .map(s => ({
//             ...s,
//             expanded: false,
//             reponsesFormatees: this.formaterReponses(s.answers)
//           }))
//           .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
        
//         this.totalSoumissions = this.soumissions.length;
//         this.appliquerFiltres();
//         this.isLoading = false;
//       },
//       error: () => {
//         this.erreur = 'Impossible de charger les soumissions.';
//         this.isLoading = false;
//       }
//     });
//   }

//   private formaterReponses(answers: any[]): Reponse[] {
//     if (!answers || answers.length === 0) return [];
//     return answers.map(a => {
//       const question = this.questions.find(q => String(q.id) === String(a.field));
      
//       let valeurExtraite = a.value || '';
      
//       // Priorité au fichier média si Django nous renvoie l'objet média lié
//       if (a.media?.file) {
//         valeurExtraite = a.media.file;
//       }

//       return {
//         field_id: a.field,
//         field_label: question?.label || `Question #${String(a.field).slice(0, 8)}`,
//         field_type: question?.field_type || 'text',
//         // On n'applique le tiret que si la chaîne finale nettoyée est vraiment vide
//         value: valeurExtraite.trim() !== '' ? valeurExtraite : '—'
//       };
//     });
//   }

//   //exporterExcel(): void {

  


//   // ── Filtres ───────────────────────────────────────────────────────────────

//   appliquerFiltres(): void {
//     let filtrées = [...this.soumissions];

//     if (this.recherche.trim()) {
//       const r = this.recherche.toLowerCase();
//       filtrées = filtrées.filter(s =>
//         (s.submitted_by_username || '').toLowerCase().includes(r)
//       );
//     }

//     this.totalSoumissions = filtrées.length;
//     const debut = (this.pageActuelle - 1) * this.parPage;
//     this.soumissionsAffichees = filtrées.slice(debut, debut + this.parPage);
//   }

//   onRecherche(): void {
//     this.pageActuelle = 1;
//     this.appliquerFiltres();
//   }

//   // ── Détail soumission ─────────────────────────────────────────────────────

//   toggleDetail(s: Soumission): void {
//     s.expanded = !s.expanded;
//   }

//   // ── Pagination ────────────────────────────────────────────────────────────

//   get totalPages(): number {
//     return Math.ceil(this.totalSoumissions / this.parPage);
//   }

//   pagePrecedente(): void {
//     if (this.pageActuelle > 1) { this.pageActuelle--; this.appliquerFiltres(); }
//   }

//   pageSuivante(): void {
//     if (this.pageActuelle < this.totalPages) { this.pageActuelle++; this.appliquerFiltres(); }
//   }

//   changerPage(p: number): void {
//     this.pageActuelle = p;
//     this.appliquerFiltres();
//   }

//   // ── Helpers ───────────────────────────────────────────────────────────────

//   formaterDate(dateIso: string): string {
//     if (!dateIso) return '—';
//     return new Date(dateIso).toLocaleDateString('fr-FR', {
//       day: '2-digit', month: 'short', year: 'numeric',
//       hour: '2-digit', minute: '2-digit'
//     });
//   }

//   ouvrirCarte(lat: number, lng: number): void {
//     window.open(`https://maps.google.com/?q=${lat},${lng}`, '_blank');
//   }

// // À remplacer ou ajouter dans soumissions.ts
// ouvrirFichier(valeur: string): void {
//   // 1. Sécurité : si la valeur est vide, nulle ou contient le tiret de cellule vide
//   if (!valeur || valeur === '—' || valeur.trim() === '') {
//     alert('Aucun fichier disponible pour cette réponse.');
//     return;
//   }

//   // 2. Si l'URL renvoyée par le serveur est déjà absolue (complète)
//   if (valeur.startsWith('http://') || valeur.startsWith('https://')) {
//     window.open(valeur, '_blank', 'noopener');
//     return;
//   }

//   // 3. Reconstruction dynamique basée sur environment.baseUrl
//   // On extrait la racine du serveur en retirant '/api/v1'
//   const racineServeur = this.baseUrl.replace('/api/v1', '');
//   let urlFinale = '';

//   // On vérifie si le chemin contient déjà le dossier 'media' pour éviter de le doubler
//   if (valeur.startsWith('/media/') || valeur.startsWith('media/')) {
//     const cheminNettoye = valeur.startsWith('/') ? valeur : `/${valeur}`;
//     urlFinale = `${racineServeur}${cheminNettoye}`;
//   } else {
//     const cheminNettoye = valeur.startsWith('/') ? valeur : `/${valeur}`;
//     urlFinale = `${racineServeur}/media${cheminNettoye}`;
//   }

//   // 4. Ouverture sécurisée du fichier dans un nouvel onglet
//   window.open(urlFinale, '_blank', 'noopener');
// }

//   retour(): void {
//     this.location.back();
//   }

//   exporterExcel(): void {
//     alert('Export Excel à venir.');
//   }
// }








import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Sidebar } from '../../shared/composants/sidebar/sidebar';
import { Header } from '../../shared/composants/header/header';

import { environment } from '../../../environments/environment.development';
import { SubmissionService } from '../../core/services/submission.service'; // ✅ Import du service mis à jour

interface Reponse {
  field_id: string;
  field_label: string;
  field_type: string;
  value: string;
}

interface Soumission {
  id: string;
  submitted_by_username: string | null;
  submitted_at: string;
  status: string;
  gps_latitude: number | null;
  gps_longitude: number | null;
  gps_accuracy: number | null;
  answers: any[];
  reponsesFormatees?: Reponse[];
  expanded?: boolean;
}

@Component({
  selector: 'app-soumissions',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar, Header],
  templateUrl: './soumissions.html',
  styleUrl: './soumissions.scss'
})
export class Soumissions implements OnInit {

  idFormulaire!: string;
  titreFormulaire = '';
  questions: any[] = [];
  soumissions: Soumission[] = [];
  soumissionsAffichees: Soumission[] = [];

  isLoading = true;
  erreur: string | null = null;

  // Pagination
  pageActuelle = 1;
  readonly parPage = 10;
  totalSoumissions = 0;

  // Filtres
  recherche = '';
  filtreStatut = 'tous';

  private baseUrl = environment.baseUrl;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient, // Gardé uniquement pour charger la structure du formulaire (/forms/forms/)
    private location: Location,
    private submissionService: SubmissionService // ✅ Injection de ton service
  ) {}
  
  ngOnInit(): void {
    this.idFormulaire = this.route.snapshot.paramMap.get('id') || '';
    if (!this.idFormulaire) {
      this.erreur = 'ID formulaire introuvable.';
      this.isLoading = false;
      return;
    }
    this.chargerDonnees();
  }

  chargerDonnees(): void {
    this.isLoading = true;

    // Récupération de la structure du formulaire
    this.http.get<any>(`${this.baseUrl}/forms/forms/${this.idFormulaire}/`).subscribe({
      next: (form) => {
        this.titreFormulaire = form.title;
        this.questions = form.questions || [];
        this.chargerSoumissions();
      },
      error: () => {
        this.erreur = 'Impossible de charger le formulaire.';
        this.isLoading = false;
      }
    });
  }

  chargerSoumissions(): void {
    // ✅ Remplacement par l'utilisation de ton service SubmissionService
    this.submissionService.getSubmissionsByForm(this.idFormulaire).subscribe({
      next: (data) => {
        console.log('📋 Toutes les soumissions reçues via le Service :', JSON.stringify(data));
        this.soumissions = data
          .filter(s => s.status === 'submitted')
          .map(s => ({
            ...s,
            expanded: false,
            reponsesFormatees: this.formaterReponses(s.answers)
          }))
          .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
        
        this.totalSoumissions = this.soumissions.length;
        this.appliquerFiltres();
        this.isLoading = false;
      },
      error: () => {
        this.erreur = 'Impossible de charger les soumissions.';
        this.isLoading = false;
      }
    });
  }

  private formaterReponses(answers: any[]): Reponse[] {
    if (!answers || answers.length === 0) return [];
    return answers.map(a => {
      const question = this.questions.find(q => String(q.id) === String(a.field));
      
      let valeurExtraite = a.value || '';
      
      if (a.media?.file) {
        valeurExtraite = a.media.file;
      }

      return {
        field_id: a.field,
        field_label: question?.label || `Question #${String(a.field).slice(0, 8)}`,
        field_type: question?.field_type || 'text',
        value: valeurExtraite.trim() !== '' ? valeurExtraite : '—'
      };
    });
  }

  // ── Filtres ───────────────────────────────────────────────────────────────

  appliquerFiltres(): void {
    let filtrées = [...this.soumissions];

    if (this.recherche.trim()) {
      const r = this.recherche.toLowerCase();
      filtrées = filtrées.filter(s =>
        (s.submitted_by_username || '').toLowerCase().includes(r)
      );
    }

    this.totalSoumissions = filtrées.length;
    const debut = (this.pageActuelle - 1) * this.parPage;
    this.soumissionsAffichees = filtrées.slice(debut, debut + this.parPage);
  }

  onRecherche(): void {
    this.pageActuelle = 1;
    this.appliquerFiltres();
  }

  // ── Détail soumission ─────────────────────────────────────────────────────

  toggleDetail(s: Soumission): void {
    s.expanded = !s.expanded;
  }

  // ── Pagination ────────────────────────────────────────────────────────────

  get totalPages(): number {
    return Math.ceil(this.totalSoumissions / this.parPage);
  }

  pagePrecedente(): void {
    if (this.pageActuelle > 1) { this.pageActuelle--; this.appliquerFiltres(); }
  }

  pageSuivante(): void {
    if (this.pageActuelle < this.totalPages) { this.pageActuelle++; this.appliquerFiltres(); }
  }

  changerPage(p: number): void {
    this.pageActuelle = p;
    this.appliquerFiltres();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  formaterDate(dateIso: string): string {
    if (!dateIso) return '—';
    return new Date(dateIso).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  ouvrirCarte(lat: number, lng: number): void {
    window.open(`https://maps.google.com/?q=${lat},${lng}`, '_blank');
  }

  ouvrirFichier(valeur: string): void {
    if (!valeur || valeur === '—' || valeur.trim() === '') {
      alert('Aucun fichier disponible pour cette réponse.');
      return;
    }

    if (valeur.startsWith('http://') || valeur.startsWith('https://')) {
      window.open(valeur, '_blank', 'noopener');
      return;
    }

    const racineServeur = this.baseUrl.replace('/api/v1', '');
    let urlFinale = '';

    if (valeur.startsWith('/media/') || valeur.startsWith('media/')) {
      const cheminNettoye = valeur.startsWith('/') ? valeur : `/${valeur}`;
      urlFinale = `${racineServeur}${cheminNettoye}`;
    } else {
      const cheminNettoye = valeur.startsWith('/') ? valeur : `/${valeur}`;
      urlFinale = `${racineServeur}/media${cheminNettoye}`;
    }

    window.open(urlFinale, '_blank', 'noopener');
  }

  retour(): void {
    this.location.back();
  }

  // ✅ LOGIQUE D'EXPORT EXCEL BRANCHÉE SUR LE SERVICE
  exporterExcel(): void {
    if (!this.idFormulaire) return;
    
    console.log('📊 Génération de l\'export via le SubmissionService...');
    
    this.submissionService.downloadExcel(this.idFormulaire).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        const nomFichier = this.titreFormulaire ? this.titreFormulaire.replace(/\s+/g, '_') : 'Formulaire';
        a.download = `Export_${nomFichier}.xlsx`;
        
        document.body.appendChild(a);
        a.click();
        
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('❌ Erreur lors du téléchargement du fichier Excel', err);
        alert('Impossible de générer le fichier Excel pour le moment.');
      }
    });
  }
}