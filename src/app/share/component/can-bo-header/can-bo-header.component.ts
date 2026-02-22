import { Component } from '@angular/core';
<<<<<<< HEAD
import { AuthServiceComponent } from '../../../core/service/auth-service.component';
=======
>>>>>>> origin/mamthui

@Component({
  selector: 'app-can-bo-header',
  imports: [],
  templateUrl: './can-bo-header.component.html',
  styleUrl: './can-bo-header.component.css'
})
export class CanBoHeaderComponent {
<<<<<<< HEAD
  username: string = '';

  constructor(private authService: AuthServiceComponent) {
    this.username = localStorage.getItem('fullName') || localStorage.getItem('username') || 'Người dùng';
  }

  onLogout(): void {
    this.authService.logout();
  }
=======

>>>>>>> origin/mamthui
}
