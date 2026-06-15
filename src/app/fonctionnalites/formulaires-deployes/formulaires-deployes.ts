import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Sidebar } from '../../shared/composants/sidebar/sidebar';
import { Header } from '../../shared/composants/header/header';
import { FormService } from '../../core/services/form.service';
import { Formulaire } from '../../core/modeles/forms.model';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { SubmissionService } from '../../core/services/submission.service'; // ✅ 1. IMPORT DU SERVICE CENTRALISÉ

@Component({
  selector: 'app-formulaires-deployes',
  standalone: true,
  imports: [CommonModule, Sidebar, Header, FormsModule],
  templateUrl: './formulaires-deployes.html',
  styleUrl: './formulaires-deployes.scss'
})
export class FormulairesDeployes implements OnInit {
  deployesAffiches: any[] = [];
  totalDeployes: number = 0;
  afficherChoixGlobal: boolean = false;
  isLoading: boolean = true;
  erreur: string | null = null;

  pageActuelle: number = 1;
  readonly parPage: number = 2;
  private tousLesDeployes: any[] = [];
  termeRecherche: string = '';

  resultatsFiltres: any[] = [];

  constructor(
    private router: Router, 
    private formService: FormService, 
    private dialog: MatDialog,
    private submissionService: SubmissionService // ✅ 2. INJECTION DU SERVICE CENTRALISÉ
  ) {}

  ngOnInit(): void {
    this.chargerDeployes();
  }

  chargerDeployes(): void {
    this.isLoading = true;
    this.erreur = null;

    this.formService.getRecentForms().subscribe({
      next: (forms: Formulaire[]) => {
        const deployes = forms
          .filter(f => {
            const s = (f.status ?? '').toLowerCase();
            return s === 'deploye';
          })
          .map(f => this.mapperFormulaire(f))
          .sort((a, b) => new Date(b.dateModificationRaw).getTime() - new Date(a.dateModificationRaw).getTime());

        this.tousLesDeployes = deployes;
        this.resultatsFiltres = [...deployes];
        this.totalDeployes = deployes.length;
        this.appliquerPage();
        this.isLoading = false;
      },
      error: (err) => {
        console.error(' [deployes] Erreur chargement :', err);
        this.erreur = 'Impossible de charger les deployes.';
        this.isLoading = false;
      }
    });
  }

  private mapperFormulaire(f: Formulaire): any {
    return {
      id: f.id,
      nom: f.title,
      secteur: f.description?.slice(0, 40) || '—',
      dateCreation: this.formaterDate(f.created_at || ''),
      dateCreationRaw: f.created_at || '',
      soumissions: 0  
    };
  }

  private formaterDate(dateIso: string): string {
    if (!dateIso) return '—';
    return new Date(dateIso).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  private appliquerPage(): void {
    const debut = (this.pageActuelle - 1) * this.parPage;
    this.deployesAffiches = this.resultatsFiltres.slice(debut, debut + this.parPage);
  }

  filtrer(): void {
    if (!this.termeRecherche.trim()) {
      this.resultatsFiltres = [...this.tousLesDeployes];
    } else {
      const terme = this.termeRecherche.toLowerCase().trim();
      this.resultatsFiltres = this.tousLesDeployes.filter(item =>
        item.nom?.toLowerCase().includes(terme) ||
        item.secteur?.toLowerCase().includes(terme)
      );
    }
    this.totalDeployes = this.resultatsFiltres.length;
    this.pageActuelle = 1;
    this.appliquerPage(); 
  }

  get totalPages(): number {
    return Math.ceil(this.totalDeployes / this.parPage);
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

  voirDonnees(id: string): void {
    this.router.navigate(['/analyse-donnees', id]);
  }

  voirReponses(id: string): void {
    this.router.navigate(['/soumissions', id]);
  }

  archive(id: string, event: Event): void {
    event.stopPropagation(); 
    if (confirm('Archivé ce formulaire ?')) {
      this.formService.archive(id).subscribe({
        next: () => {
          alert('Formulaire archivé avec succès !');
          this.chargerDeployes(); 
        },
        error: (err) => console.error('Erreur lors de l\'archivage ', err)
      });
    }
  }

  ouvrirSelectionGlobale(): void { this.afficherChoixGlobal = true; }
  fermerSelectionGlobale(): void { this.afficherChoixGlobal = false; }

  ouvrirStatistiques(id: string): void {
    console.log('📊 Ouvrir stats pour formulaire ID:', id);
    this.router.navigate(['/statistiques', id]);
  }

  // ✅ 3. AJOUT DE LA MÉTHODE UNIQUE DE TÉLÉCHARGEMENT BRANCHÉE SUR LE SERVICE
  exporterExcel(id: string, nom: string): void {
    if (!id) return;
    
    console.log('📊 Lancement de l\'export Excel depuis la liste des déployés pour :', id);
    
    this.submissionService.downloadExcel(id).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        const nomFichier = nom ? nom.replace(/\s+/g, '_') : 'Formulaire';
        a.download = `Export_${nomFichier}.xlsx`;
        
        document.body.appendChild(a);
        a.click();
        
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('❌ Échec du téléchargement Excel depuis la liste', err);
        alert('Une erreur est survenue lors de la génération du fichier Excel.');
      }
    });
  }
}