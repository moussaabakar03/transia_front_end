import { Component, OnInit, Output, EventEmitter, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ModalMonProfil } from '../modal-mon-profil/modal-mon-profil';
import { ProfilDTO, UserResponse } from '../../models/users';
import { UserService } from '../../../core/services/user-service';
import { catchError } from 'rxjs/internal/operators/catchError';
import { of } from 'rxjs';


@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, ModalMonProfil],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header implements OnInit {

  @Output() actionCreer = new EventEmitter<void>();

  userName: string = 'Utilisateur';
  profilData: ProfilDTO = { photoProfil: null, adresse: '' };

  userRole: string = '';
  showDropdown: boolean = false;

  afficherMonProfil: boolean = false;

  // États d'affichage des modales de création 
  afficherChoixProjet: boolean = false;
  afficherCreationManuelle: boolean = false;
  afficherImportExcel: boolean = false;

  constructor(private authService: AuthService, private router: Router, private userService: UserService, private elementRef: ElementRef) {}

  ngOnInit(): void {
    this.userRole = this.authService.getRole() || '';
    const user = this.authService.getCurrentUser();
    this.userName = user?.fullName || 'Utilisateur';


    this.userService.getMyProfil().pipe(
      catchError(() => of(null))
    ).subscribe(p => {
        this.profilData = p || { photoProfil: null, adresse: '' };
        console.log('Profil data loaded in header:', this.profilData);
    });

    
  }

  declencherCreation(): void {
    this.afficherChoixProjet = true;
  }

  ouvrirCreationManuelle(): void {
    this.afficherChoixProjet = false;
    this.afficherCreationManuelle = true;
  }

  ouvrirImportExcel(): void {
    this.afficherChoixProjet = false;
    this.afficherImportExcel = true;
  }

  rafraichirDashboard(): void {
    window.location.reload();
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  ouvrirMonProfil(): void {
    this.showDropdown = false;
    this.afficherMonProfil = true;
  }

  fermerMonProfil(): void {
    this.afficherMonProfil = false;
  }

  @HostListener('document:click', ['$event'])
  closeDropdownOnOutsideClick(event: MouseEvent): void {
    if (this.showDropdown && !this.elementRef.nativeElement.contains(event.target)) {
      this.showDropdown = false;
    }
  }
}
