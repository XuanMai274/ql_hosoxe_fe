import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthServiceComponent } from '../../../core/service/auth-service.component';
import { inject } from '@angular/core';

@Component({
  selector: 'app-can-bo-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './can-bo-sidebar.component.html',
  styleUrls: ['./can-bo-sidebar.component.css']
})
export class CanBoSidebarComponent {
  activeSubmenu: string | null = null;
  fullName: string = '';

  constructor(
    private authService: AuthServiceComponent,
    private router: Router
  ) {
    this.fullName = sessionStorage.getItem('fullName') || 'Cán bộ BIDV';

    // Auto open submenus based on current route
    this.router.events.subscribe(() => {
      const url = this.router.url;
      if (url.includes('quan-ly-don-bao-lanh') || url.includes('them-bao-lanh') || url.includes('danh-sach-bao-lanh')) {
        this.activeSubmenu = 'baolanh';
      } else if (url.includes('credit-contract') || url.includes('mortgage-contract')) {
        this.activeSubmenu = 'hopdong';
      } else if (url.includes('ho-so-xe') || url.includes('nhap-kho') || url.includes('xuat-kho') || url.includes('rut-ho-so')) {
        this.activeSubmenu = 'hosoxe';
      } else if (url.includes('khoan-vay')) {
        this.activeSubmenu = 'vay';
      } else if (url.includes('admin/employees')) {
        this.activeSubmenu = 'employees';
      } else if (url.includes('admin/customers')) {
        this.activeSubmenu = 'customers';
      }
    });
  }

  toggleSubmenu(name: string) {
    this.activeSubmenu = this.activeSubmenu === name ? null : name;
  }

  hasRole(roles: string[]): boolean {
    return this.authService.hasRole(roles);
  }
}
