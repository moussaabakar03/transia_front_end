import { Routes } from '@angular/router';
import { Login } from './shared/composants/login/login';
import { TableauDeBord } from './fonctionnalites/tableau-de-bord/tableau-de-bord';
import { FormulairesDeployes } from './fonctionnalites/formulaires-deployes/formulaires-deployes';
import { GestionComptes } from './fonctionnalites/gestion-comptes/gestion-comptes';
import { AnalyseDonnees } from './fonctionnalites/analyse-donnees/analyse-donnees';
import { authGuard } from './core/guards/auth.guard';
import { Villes } from './fonctionnalites/transport/villes/villes';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },

  // Routes protégées
  { path: 'tableau-de-bord',       component: TableauDeBord,       canActivate: [authGuard] },
  { path: 'formulaires',           component: FormulairesDeployes, canActivate: [authGuard] },
  { path: 'gestion-comptes',       component: GestionComptes,      canActivate: [authGuard] },
  { path: 'analyse-donnees/:id',   component: AnalyseDonnees,      canActivate: [authGuard] },


  { path: 'villes',   component: Villes,      canActivate: [authGuard] },

  { path: '**', redirectTo: 'login' }
];