import { Routes } from '@angular/router';
import { dashboardDataResolver } from './feature/dashboard/services/data-resolver.service';

export const routes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./feature/dashboard/dashboard.component').then(
        (c) => c.DashboardComponent
      ),
    resolve: { data: dashboardDataResolver },
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },
];
