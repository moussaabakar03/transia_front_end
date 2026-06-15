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
  // ── Splash screen ────────────────────────────────────────────────────────
  splashVisible = true;
  splashFading = false;

  // ── Formulaire ───────────────────────────────────────────────────────────
  username = '';
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
    if (!this.username.trim() || !this.password.trim()) {
      this.erreur = 'Veuillez remplir tous les champs.';
      return;
    }

    this.isLoading = true;
    this.erreur = '';

    this.authService.login({ username: this.username.trim(), password: this.password }).subscribe({
      next: (response: any) => {
        console.log('📦 Réponse complète :', JSON.stringify(response));
        
        // Extraction sécurisée du rôle par rapport à tes Enums Spring Boot
        // 💥 Remplace l'ancien bloc de détection du rôle par celui-ci :
        const role = (response?.roles && response.roles.length > 0) 
          ? response.roles[0] 
          : (this.authService.getRole() || 'CLIENT');

        console.log(`🔑 Rôle détecté : ${role}`, response);

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
        this.erreur = 'Identifiants incorrects. Veuillez réessayer.';
        this.isLoading = false;
      }
    });
  }
}