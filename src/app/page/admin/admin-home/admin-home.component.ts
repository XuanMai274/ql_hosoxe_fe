import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../../service/admin.service';

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-home.component.html',
  styleUrl: './admin-home.component.css'
})
export class AdminHomeComponent implements OnInit {
  stats = {
    totalEmployees: 0,
    totalCustomers: 0,
    totalRoles: 0,
    activeAccounts: 0
  };

  adminName: string = '';

  constructor(private adminService: AdminService) {
    this.adminName = sessionStorage.getItem('fullName') || 'Administrator';
  }

  ngOnInit(): void {
    this.loadQuickStats();
  }

  loadQuickStats(): void {
    // Gọi API để lấy số liệu thực tế
    this.adminService.getEmployees().subscribe({
      next: (data: any) => {
        const content = data?.content || (Array.isArray(data) ? data : []);
        this.stats.totalEmployees = content.length;
        this.stats.activeAccounts = content.filter((e: any) => e.status === 'ACTIVE').length;
      },
      error: () => console.error('Không thể tải thống kê nhân viên')
    });

    this.adminService.getCustomers().subscribe({
      next: (data: any) => {
        const content = data?.content || (Array.isArray(data) ? data : []);
        this.stats.totalCustomers = content.length;
      },
      error: () => console.error('Không thể tải thống kê khách hàng')
    });

    this.adminService.getRoles().subscribe({
      next: (data) => {
        this.stats.totalRoles = data?.length || 0;
      },
      error: () => console.error('Không thể tải thống kê vai trò')
    });
  }
}
