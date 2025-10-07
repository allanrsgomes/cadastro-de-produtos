import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Products } from './pages/products/products';
import { Layout } from './pages/layout/layout';
import { NewProduct } from './pages/new-product/new-product';
import { authGuard } from './guards/auth-guard';
import { EditProduct } from './pages/edit-product/edit-product';

export const routes: Routes = [
  {
    path: 'login',
    component: Login,
  },
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full',
  },
  {
    path: '',
    component: Layout,
    canActivateChild: [authGuard],
    children: [
      {
        path: 'products',
        component: Products,
      },
      {
        path: 'new-product',
        component: NewProduct,
      },
      {
        path: 'edit-product/:id',
        component: EditProduct,
      }
    ],
  },
  {
    path: '**',
    redirectTo: '/login',
  }
];
