import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modale-apercu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modale-apercu.html',
  styleUrl: './modale-apercu.scss'
})
export class ModaleApercu {
  // Reçoit les informations du projet sélectionné depuis le parent
  @Input() projet: any = null;
  
  @Output() fermerModale = new EventEmitter<void>();

  fermer(): void {
    this.fermerModale.emit();
  }
}