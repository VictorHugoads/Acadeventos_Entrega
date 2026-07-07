import { Routes } from '@angular/router';

import { PgHomepage } from './pages/pg-homepage/pg-homepage';
import { PgLogin } from './pages/pg-login/pg-login';
import { PgMyEntries } from './pages/pg-my-entries/pg-my-entries';
import { PgRegister } from './pages/pg-register/pg-register';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: PgLogin
  },
  {
    path: 'register',
    component: PgRegister
  },
  {
    path: 'homepage',
    component: PgHomepage
  },
  {
    path: 'my-entries',
    component: PgMyEntries
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];