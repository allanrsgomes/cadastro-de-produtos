import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle';
import { UserService } from '../../services/user';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, ThemeToggleComponent, CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {
  isUserMenuOpen = signal(false);

  private readonly _userService = inject(UserService);
  private readonly _router = inject(Router);

  toggleUserMenu() {
    this.isUserMenuOpen.update(value => !value);
  }

  closeUserMenu() {
    this.isUserMenuOpen.set(false);
  }

  logout() {
    this._userService.logout().subscribe({
      next: () => {
        localStorage.removeItem('auth-token');
        this._router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Erro ao fazer logout:', error);
        // Mesmo com erro, limpar token e redirecionar
        localStorage.removeItem('auth-token');
        this._router.navigate(['/login']);
      }
    });
  }
}
