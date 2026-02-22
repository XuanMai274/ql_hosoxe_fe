import { Component } from '@angular/core';
import { AuthServiceComponent } from '../../../core/service/auth-service.component';

@Component({
  selector: 'app-can-bo-header',
  imports: [],
  templateUrl: './can-bo-header.component.html',
  styleUrl: './can-bo-header.component.css'
})
export class CanBoHeaderComponent {
  username: string = '';

  constructor(private authService: AuthServiceComponent) {
    this.username = localStorage.getItem('fullName') || localStorage.getItem('username') || 'Người dùng';
  }

  onLogout(): void {
    this.authService.logout();
  }
}
