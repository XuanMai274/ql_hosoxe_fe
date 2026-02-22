import { Component } from '@angular/core';
import { LoanDTO } from '../../../models/loan.model';
import { LoanService } from '../../../service/loan.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-danh-sach-khoan-vay',
  imports: [CommonModule, FormsModule,RouterModule],
  templateUrl: './danh-sach-khoan-vay.component.html',
  styleUrl: './danh-sach-khoan-vay.component.css'
})
export class DanhSachKhoanVayComponent {
  loans: LoanDTO[] = [];

  page = 0;
  size = 10;
  totalPages = 0;
  totalElements = 0;
  totalAmount = 0;
  contractNumber: string = '';
  accountNumber: string = '';
  loanStatus: string = '';
  loading = false;
  chassisNumber: string = '';
  docId: string = '';
  dueInDays?: number;
  constructor(private loanService: LoanService) { }

  ngOnInit(): void {
    this.loadLoans();
  }

  loadLoans(): void {
    this.loading = true;

    this.loanService
      .getLoans(
        this.page,
        this.size,
        this.contractNumber,
        this.chassisNumber,
        this.loanStatus,
        this.docId,
        this.dueInDays
      )
      .subscribe({
        next: (res) => {
          this.loans = res.content;
          this.totalPages = res.totalPages;
          this.totalElements = res.totalElements;

          this.calculateTotalAmount();
          this.loading = false;
        },
        error: (err) => {
          console.error('Load loans error:', err);
          this.loading = false;
        }
      });
  }

  search(): void {
    this.page = 0;
    this.loadLoans();
  }

  changePage(newPage: number): void {
    if (newPage < 0 || newPage >= this.totalPages) return;
    this.page = newPage;
    this.loadLoans();
  }

  calculateTotalAmount(): void {
    this.totalAmount = this.loans
      .map(l => l.loanAmount || 0)
      .reduce((a, b) => a + b, 0);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'status-active';
      case 'CLOSED': return 'status-closed';
      case 'OVERDUE': return 'status-overdue';
      default: return '';
    }
  }

  viewDetail(id: number): void {
    console.log('View loan detail:', id);
    // có thể navigate sang trang detail
  }

  goToCreate(): void {
    console.log('Navigate create loan');
  }
}
