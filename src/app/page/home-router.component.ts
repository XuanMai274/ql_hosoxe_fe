import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminHomeComponent } from './admin/admin-home/admin-home.component';
import { OfficerHomeComponent } from './officer/officer-home/officer-home.component';
import { AuthServiceComponent } from '../core/service/auth-service.component';

@Component({
  selector: 'app-home-router',
  standalone: true,
  imports: [CommonModule, AdminHomeComponent, OfficerHomeComponent],
  template: `
    <app-admin-home *ngIf="userRole === 'admin'"></app-admin-home>
    <app-officer-home *ngIf="userRole !== 'admin'"></app-officer-home>
  `
})
export class HomeRouterComponent implements OnInit {
  userRole: string = '';

  constructor(private authService: AuthServiceComponent) { }

  ngOnInit(): void {
    const role = this.authService.getUserRole();
    this.userRole = role ? role.toLowerCase() : '';
  }
}
