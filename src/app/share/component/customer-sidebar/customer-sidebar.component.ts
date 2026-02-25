import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthServiceComponent } from '../../../core/service/auth-service.component';

@Component({
    selector: 'app-customer-sidebar',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './customer-sidebar.component.html',
    styleUrl: './customer-sidebar.component.css'
})
export class CustomerSidebarComponent {
    activeSubmenu: string | null = null;
    fullName: string = '';

    constructor(private authService: AuthServiceComponent) {
        this.fullName = localStorage.getItem('fullName') || 'Khách hàng';
    }

    toggleSubmenu(name: string) {
        this.activeSubmenu = this.activeSubmenu === name ? null : name;
    }
}
