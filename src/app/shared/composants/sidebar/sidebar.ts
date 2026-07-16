import { Component, OnInit, Output, EventEmitter, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

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
  private authService = inject(AuthService);

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
    this.userRole = this.authService.getRole() || '';
    return this.isAdmin();
  }

  isAdmin(): boolean {
    return this.authService.hasRole('SUPER_ADMIN') || this.authService.hasRole('ADMIN_AGENCE');
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}