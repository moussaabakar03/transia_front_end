import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login implements OnInit {
  //  Splash screen 
  splashVisible = true;
  splashFading = false;

  //  Formulaire ─
  telephone = '';
  password = '';
  isLoading = false;
  erreur = '';
  passwordVisible = false;
  private urlRetour: string | null = null;

  currentYear: number = new Date().getFullYear();

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Récupère l'URL de redirection si l'utilisateur arrive via un guard
    this.urlRetour = this.route.snapshot.queryParams['returnUrl'] || null;

    // Splash : 2.2s affiché, puis fade out 0.6s, puis disparaît
    setTimeout(() => {
      this.splashFading = true;
      setTimeout(() => {
        this.splashVisible = false;
      }, 600);
    }, 2200);
  }

  togglePassword(): void {
    this.passwordVisible = !this.passwordVisible;
  }


  seConnecter(): void {
    if (!this.telephone.trim() || !this.password.trim()) {
      this.erreur = 'Veuillez remplir tous les champs.';
      return;
    }

    this.isLoading = true;
    this.erreur = '';

    this.authService.login({ telephone: this.telephone.trim(), password: this.password }).subscribe({
      next: () => {
        // CONDITION DE SÉCURITÉ TRANSIA : seuls SUPER_ADMIN, ADMIN_AGENCE, AGENT_ACCUEIL accèdent au back-office
        if (!this.authService.isBackOfficeUser()) {
          this.authService.logout();
          this.erreur = 'Accès refusé !';
          this.isLoading = false;
          return;
        }

        if (this.urlRetour) {
          this.router.navigateByUrl(this.urlRetour);
          this.isLoading = false;
          return;
        }

        this.router.navigate(['/tableau-de-bord']);
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Erreur de connexion :', err);
        this.erreur = err?.error?.message || 'Identifiants incorrects. Veuillez réessayer.';
        this.isLoading = false;
      }
    });
  }



}