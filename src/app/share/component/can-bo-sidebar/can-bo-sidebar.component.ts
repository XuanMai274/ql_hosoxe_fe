import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthServiceComponent } from '../../../core/service/auth-service.component';

@Component({
  selector: 'app-can-bo-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './can-bo-sidebar.component.html',
  styleUrl: './can-bo-sidebar.component.css'
})
export class CanBoSidebarComponent {
  activeSubmenu: string | null = null;
  fullName: string = '';

  constructor(private authService: AuthServiceComponent) {
    this.fullName = sessionStorage.getItem('fullName') || 'Cán bộ BIDV';
  }

  toggleSubmenu(name: string) {
    this.activeSubmenu = this.activeSubmenu === name ? null : name;
  }

  hasRole(roles: string[]): boolean {
    return this.authService.hasRole(roles);
  }
}
