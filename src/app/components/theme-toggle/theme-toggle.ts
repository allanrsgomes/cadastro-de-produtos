import { Component, inject } from '@angular/core';
import { ThemeService } from '../../services/theme';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './theme-toggle.html',
})
export class ThemeToggleComponent {
  private themeService = inject(ThemeService);

  isDark = this.themeService.isDark;

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
