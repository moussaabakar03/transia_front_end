import { Routes } from '@angular/router';
import { Login } from './shared/composants/login/login';
import { TableauDeBord } from './fonctionnalites/tableau-de-bord/tableau-de-bord';
import { FormulairesDeployes } from './fonctionnalites/formulaires-deployes/formulaires-deployes';
import { GestionComptes } from './fonctionnalites/gestion-comptes/gestion-comptes';
import { AnalyseDonnees } from './fonctionnalites/analyse-donnees/analyse-donnees';
import { authGuard } from './core/guards/auth.guard';
import { Villes } from './fonctionnalites/transport/villes/villes';
import { Vehicules } from './fonctionnalites/transport/vehicules/vehicules';
import { Trajets } from './fonctionnalites/transport/trajets/trajets';
import { Reservations } from './fonctionnalites/reservations/reservations';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },

  // Routes protégées
  { path: 'tableau-de-bord',       component: TableauDeBord,       canActivate: [authGuard] },
  { path: 'formulaires',           component: FormulairesDeployes, canActivate: [authGuard] },
  { path: 'gestion-comptes',       component: GestionComptes,      canActivate: [authGuard] },
  { path: 'analyse-donnees/:id',   component: AnalyseDonnees,      canActivate: [authGuard] },

  // Routes transport
  { path: 'villes',                component: Villes,             canActivate: [authGuard] },
  { path: 'vehicules',             component: Vehicules,          canActivate: [authGuard] },
  { path: 'trajets',               component: Trajets,            canActivate: [authGuard] },

  // Réservations
  { path: 'reservations',          component: Reservations,       canActivate: [authGuard] },

  { path: '**', redirectTo: 'login' }
];