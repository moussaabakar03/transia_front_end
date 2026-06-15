import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Sidebar } from '../../shared/composants/sidebar/sidebar'; // Ajuste les chemins selon ton projet
import { Header } from '../../shared/composants/header/header';
import { StatsCards } from './composants/stats-cards/stats-cards';

// 1. BIEN IMPORTER LA MODALE ICI
import { ModaleApercu } from '../../shared/composants/modale-apercu/modale-apercu';

@Component({
  selector: 'app-tableau-de-bord',
  standalone: true,
  // 2. BIEN AJOUTER "ModaleCreation" DANS LES IMPORTS DE L'ARCHITECTURE STANDALONE
  imports: [
    CommonModule, 
    Sidebar, 
    Header, 
    StatsCards, 
    ModaleApercu
  ],
  templateUrl: './tableau-de-bord.html',
  styleUrl: './tableau-de-bord.scss'
})
export class TableauDeBord implements OnInit {
  // Variables d'état pour l'affichage des modales
  afficherModale: boolean = false;
  afficherChoix: boolean = false;
  projetSelectionne: any = null;
  refreshSignal: number = 0;

  ngOnInit(): void {
    console.log('📊 Tableau de bord initialisé.');
  }

  // 3. LA MÉTHODE APPELÉE PAR TON BOUTON "CRÉER UN FORMULAIRE"
  ouvrirPopUp(): void {
    console.log('🔌 Clic sur CRÉER UN FORMULAIRE : Ouverture de la modale');
    this.afficherModale = true;
  }

  fermerPopUp(): void {
    this.afficherModale = false;
  }

  rafrachirDonnees(): void {
    this.refreshSignal++; // Secoue les enfants pour recharger la BDD
    this.fermerPopUp();
  }

  // Fonctions pour le Header (actionCreer)
  ouvrirSelection(): void {
    this.afficherChoix = true;
  }

  fermerSelection(): void {
    this.afficherChoix = false;
  }

  declencherCreationManuelle(): void {
    this.fermerSelection();
    this.ouvrirPopUp(); // Bascule sur la création
  }

  // Fonctions pour l'aperçu
  ouvrirApercu(projet: any): void {
    this.projetSelectionne = projet;
  }

  fermerApercu(): void {
    this.projetSelectionne = null;
  }
}