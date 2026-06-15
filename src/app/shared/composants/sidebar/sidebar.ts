import { Component, OnInit, Output, EventEmitter, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar implements OnInit {

  userRole?: string = '';
  isOpen: boolean = false; // Fermé par défaut sur mobile

  private router = inject(Router);

  @Output() sidebarToggled = new EventEmitter<boolean>();

  ngOnInit(): void {
    this.getRole();
    // Sur desktop (>= 1024px), sidebar ouvert par défaut
    this.isOpen = window.innerWidth >= 1024;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    const width = (event.target as Window).innerWidth;
    if (width >= 1024) {
      this.isOpen = true;
    } else {
      this.isOpen = false;
    }
    this.sidebarToggled.emit(this.isOpen);
  }

  toggle(): void {
    this.isOpen = !this.isOpen;
    this.sidebarToggled.emit(this.isOpen);
  }

  close(): void {
    if (window.innerWidth < 1024) {
      this.isOpen = false;
      this.sidebarToggled.emit(false);
    }
  }

  getRole(): boolean {
    this.userRole = localStorage.getItem('userRole') || '';
    return this.userRole === 'ADMIN' || this.userRole === 'SUPER_ADMIN';
  }

  logout() {
    // Exemple : effacer le token et rediriger vers la page de connexion
    localStorage.removeItem('token');
    this.router.navigate(['/connexion']);
  }
}