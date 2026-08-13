import { Routes } from '@angular/router';
import { Login } from './shared/composants/login/login';
import { TableauDeBord } from './fonctionnalites/tableau-de-bord/tableau-de-bord';
import { GestionComptes } from './fonctionnalites/gestion-comptes/gestion-comptes';
import { authGuard } from './core/guards/auth.guard';
import { Villes } from './fonctionnalites/transport/villes/villes';
import { Vehicules } from './fonctionnalites/transport/vehicules/vehicules';
import { Trajets } from './fonctionnalites/transport/trajets/trajets';
import { Reservations } from './fonctionnalites/reservations/reservations';
import { Feedbacks } from './fonctionnalites/feedbacks/feedbacks';
import { ColisComponent } from './fonctionnalites/colis/colis';
import { TourneesComponent } from './fonctionnalites/tournees/tournees';
import { Agences } from './fonctionnalites/agences/agences';
import { TarifsComponent } from './fonctionnalites/tarifs/tarifs';
import { DemandesCollecteComponent } from './fonctionnalites/demandes-collecte/demandes-collecte';
import { SuiviColisComponent } from './fonctionnalites/suivi-colis/suivi-colis';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },

  // Routes publiques (sans authentification)
  { path: 'suivi/:numeroSuivi',  component: SuiviColisComponent },
  { path: 'suivi',               component: SuiviColisComponent },

  // Routes protégées
  { path: 'tableau-de-bord',     component: TableauDeBord,     canActivate: [authGuard] },
  { path: 'gestion-comptes',     component: GestionComptes,    canActivate: [authGuard] },

  // Transport
  { path: 'villes',              component: Villes,            canActivate: [authGuard] },
  { path: 'vehicules',           component: Vehicules,         canActivate: [authGuard] },
  { path: 'trajets',             component: Trajets,           canActivate: [authGuard] },

  // Réservations
  { path: 'reservations',        component: Reservations,      canActivate: [authGuard] },

  // Colis & tournées
  { path: 'colis',               component: ColisComponent,    canActivate: [authGuard] },
  { path: 'demandes-collecte',   component: DemandesCollecteComponent, canActivate: [authGuard] },
  { path: 'tournees',            component: TourneesComponent, canActivate: [authGuard] },
  { path: 'tarifs-colis',        component: TarifsComponent,   canActivate: [authGuard] },

  // Admin
  { path: 'agences',             component: Agences,           canActivate: [authGuard] },
  { path: 'feedbacks',           component: Feedbacks,         canActivate: [authGuard] },

  { path: '**', redirectTo: 'login' }
];
