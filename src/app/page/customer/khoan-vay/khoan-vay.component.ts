import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LoanDTO } from '../../../models/loan.model';
import { CustomerLoanService } from '../../../service/customer-loan.service';
import { Subject, debounceTime } from 'rxjs';

@Component({
    selector: 'app-customer-khoan-vay',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './khoan-vay.component.html',
    styleUrl: './khoan-vay.component.css'
})
export class CustomerKhoanVayComponent implements OnInit {

    loans: LoanDTO[] = [];
    loading = false;
    error = '';

    // Pagination
    page = 0;
    size = 10;
    totalPages = 0;
    totalElements = 0;
    totalAmount = 0;

    // Filters
    contractNumber = '';
    chassisNumber = '';
    loanStatus = '';
    docId = '';
    dueInDays?: number;
    selectedLoan: LoanDTO | null = null;
    showDetailModal = false;
    detailLoading = false;

    private searchSubject = new Subject<void>();

    constructor(private loanService: CustomerLoanService) {
        this.searchSubject.pipe(
            debounceTime(500)
        ).subscribe(() => {
            this.loadLoans(0);
        });
    }

    ngOnInit(): void {
        this.loadLoans();
    }

    loadLoans(page = 0): void {
        this.page = page;
        this.loading = true;
        this.error = '';

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
                    this.loans = res.content || [];
                    this.totalPages = res.totalPages || 0;
                    this.totalElements = res.totalElements || 0;
                    this.calculateTotalAmount();
                    this.loading = false;
                },
                error: (err) => {
                    console.error('Load loans error:', err);
                    this.loading = false;
                    this.error = 'Không thể tải dữ liệu từ server. Vui lòng thử lại sau.';
                }
            });
    }

    onSearch(): void {
        this.searchSubject.next();
    }

    changePage(newPage: number): void {
        if (newPage < 0 || (this.totalPages > 0 && newPage >= this.totalPages)) return;
        this.loadLoans(newPage);
    }

    prev(): void {
        if (this.page > 0) this.loadLoans(this.page - 1);
    }

    next(): void {
        if (this.page + 1 < this.totalPages) this.loadLoans(this.page + 1);
    }

    calculateTotalAmount(): void {
        this.totalAmount = this.loans
            .map(l => l.loanAmount || 0)
            .reduce((a, b) => a + b, 0);
    }

    openDetail(id: number): void {
        this.detailLoading = true;
        this.showDetailModal = true;
        this.loanService.getLoanDetail(id).subscribe({
            next: (res) => {
                this.selectedLoan = res;
                this.detailLoading = false;
            },
            error: (err) => {
                console.error('Get loan detail error:', err);
                this.detailLoading = false;
            }
        });
    }

    closeDetail(): void {
        this.showDetailModal = false;
        this.selectedLoan = null;
    }

    getStatusClass(status: string): string {
        switch (status?.toUpperCase()) {
            case 'ACTIVE': return 'status-active';
            case 'CLOSED':
            case 'PAID_OFF': return 'status-closed';
            case 'OVERDUE': return 'status-overdue';
            default: return '';
        }
    }

    getStatusLabel(status: string): string {
        switch (status?.toUpperCase()) {
            case 'ACTIVE': return 'Đang hiệu lực';
            case 'CLOSED':
            case 'PAID_OFF': return 'Đã tất toán';
            case 'OVERDUE': return 'Quá hạn';
            default: return status || '—';
        }
    }
}
