import { Component } from '@angular/core';
import { DisbursementDTO } from '../../../models/disbursement.model';
import { DisbursementService } from '../../../service/disbursement.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-danh-sach-khoan-vay',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './danh-sach-khoan-vay.component.html',
  styleUrl: './danh-sach-khoan-vay.component.css'
})
export class DanhSachKhoanVayComponent {
  disbursements: DisbursementDTO[] = [];

  page = 0;
  size = 10;
  totalPages = 0;
  totalElements = 0;
  totalAmount = 0;
  contractNumber: string = '';
  fromDate: string = '';
  toDate: string = '';
  loading = false;

  constructor(private disbursementService: DisbursementService) { }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;

    this.disbursementService
      .getDisbursements(
        this.page,
        this.size,
        this.contractNumber,
        this.fromDate,
        this.toDate
      )
      .subscribe({
        next: (res) => {
          this.disbursements = res.content;
          this.totalPages = res.totalPages;
          this.totalElements = res.totalElements;
          this.calculateTotal();
          this.loading = false;
        },
        error: (err) => {
          console.error('Load disbursements error:', err);
          this.loading = false;
        }
      });
  }

  search(): void {
    this.page = 0;
    this.loadData();
  }

  changePage(newPage: number): void {
    if (newPage < 0 || newPage >= this.totalPages) return;
    this.page = newPage;
    this.loadData();
  }

  calculateTotal(): void {
    this.totalAmount = this.disbursements
      .reduce((sum, d) => sum + (d.disbursementAmount || 0), 0);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('vi-VN').format(value);
  }

  getStatusClass(status?: string): string {
    switch (status?.toUpperCase()) {
      case 'ACTIVE': return 'status-active';
      case 'PAID_OFF':
      case 'PAID': return 'status-closed';
      case 'OVERDUE': return 'status-overdue';
      default: return 'status-default';
    }
  }

  getStatusLabel(status?: string): string {
    switch (status?.toUpperCase()) {
      case 'ACTIVE': return 'Đang vay';
      case 'PAID_OFF':
      case 'PAID': return 'Đã tất toán';
      case 'OVERDUE': return 'Quá hạn';
      default: return status || '—';
    }
  }
}
