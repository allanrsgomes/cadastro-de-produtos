import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle';

@Component({
  selector: 'app-header',
  imports: [RouterLink, ThemeToggleComponent],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {

}
