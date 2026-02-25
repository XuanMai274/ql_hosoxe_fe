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
    this.adminName = localStorage.getItem('fullName') || 'Administrator';
  }

  ngOnInit(): void {
    this.loadQuickStats();
  }

  loadQuickStats(): void {
    // Gọi API để lấy số liệu thực tế
    this.adminService.getEmployees().subscribe(data => {
      this.stats.totalEmployees = data.length;
      this.stats.activeAccounts = data.filter(e => e.status === 'ACTIVE').length;
    });

    this.adminService.getCustomers().subscribe(data => {
      this.stats.totalCustomers = data.length;
    });

    this.adminService.getRoles().subscribe(data => {
      this.stats.totalRoles = data.length;
    });
  }
}
