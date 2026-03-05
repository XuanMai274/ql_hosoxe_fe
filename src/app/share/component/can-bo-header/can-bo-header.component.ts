import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthServiceComponent } from '../../../core/service/auth-service.component';

@Component({
  selector: 'app-can-bo-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './can-bo-header.component.html',
  styleUrl: './can-bo-header.component.css'
})
export class CanBoHeaderComponent {
  username: string = '';
  userRole: string = '';
  showUserDropdown: boolean = false;

  constructor(private authService: AuthServiceComponent) {
    this.username = localStorage.getItem('fullName') || 'Officer';
    this.userRole = this.authService.getUserRole();
  }

  toggleUserDropdown(): void {
    this.showUserDropdown = !this.showUserDropdown;
  }

  onLogout(): void {
    this.authService.logout();
  }
}
