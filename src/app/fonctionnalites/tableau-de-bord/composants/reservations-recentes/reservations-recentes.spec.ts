import { Component, Input, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormService } from '../../../../core/services/form.service';
import { Formulaire } from '../../../../core/modeles/forms.model';

@Component({
  selector: 'app-projets-recents',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './projets-recents.html',
  styleUrl: './projets-recents.scss'
})
export class ProjetsRecents implements OnInit, OnChanges {
  private formService = inject(FormService);

  @Input() triggerRefresh: any;
  
  // Fini le tableau en dur, on part à vide !
  listeProjets: Formulaire[] = []; 

  ngOnInit(): void {
    this.chargerProjets();
  }

  // Se déclenche automatiquement quand l'utilisateur crée un projet dans la modale
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['triggerRefresh'] && !changes['triggerRefresh'].firstChange) {
      this.chargerProjets();
    }
  }

  chargerProjets(): void {
    this.formService.getRecentForms().subscribe({
      next: (donnees) => {
        this.listeProjets = donnees || [];
        console.log(' Liste mise à jour depuis la DB :', this.listeProjets);
      },
      error: (err) => {
        console.error(' Impossible de récupérer les formulaires :', err);
        this.listeProjets = [];
      }
    });
  }
}