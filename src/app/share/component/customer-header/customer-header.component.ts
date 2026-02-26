import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthServiceComponent } from '../../../core/service/auth-service.component';

@Component({
    selector: 'app-customer-header',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './customer-header.component.html',
    styleUrl: './customer-header.component.css'
})
export class CustomerHeaderComponent {
    username: string = '';
    userRole: string = '';
    showUserDropdown: boolean = false;

    constructor(private authService: AuthServiceComponent) {
        this.username = localStorage.getItem('fullName') || 'Khách hàng';
        this.userRole = this.authService.getUserRole();
    }

    toggleUserDropdown(): void {
        this.showUserDropdown = !this.showUserDropdown;
    }

    onLogout(): void {
        this.authService.logout();
    }
}
