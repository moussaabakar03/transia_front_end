import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';


/*/lesimports*/

import { RouterOutlet } from '@angular/router';
import { Sidebar } from './shared/composants/sidebar/sidebar';




@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('valkens-collecte');

  sidebarOuvert: boolean = true;  // par défaut ouvert sur desktop
}
