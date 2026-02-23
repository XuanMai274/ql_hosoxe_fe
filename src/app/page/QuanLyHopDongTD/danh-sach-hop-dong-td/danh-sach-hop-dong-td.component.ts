import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CreditContract } from '../../../models/credit_contract';
import { CreditContractService } from '../../../service/credit_contract.service';

@Component({
    selector: 'app-danh-sach-hop-dong-td',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './danh-sach-hop-dong-td.component.html',
    styleUrl: './danh-sach-hop-dong-td.component.css'
})
export class DanhSachHopDongTDComponent implements OnInit {
    contracts: CreditContract[] = [];
    isLoading = false;

    constructor(
        private creditContractService: CreditContractService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loadContracts();
    }

    loadContracts(): void {
        this.isLoading = true;
        this.creditContractService.getCreditContracts().subscribe({
            next: (data) => {
                this.contracts = data;
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading contracts', err);
                this.isLoading = false;
            }
        });
    }

    goToAdd(): void {
        this.router.navigate(['/manager/credit-contract/add']);
    }

    goToEdit(id: number): void {
        this.router.navigate(['/manager/credit-contract/edit', id]);
    }

    formatDate(dateStr: string | undefined): string {
        if (!dateStr) return 'N/A';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('vi-VN');
        } catch (e) {
            return dateStr;
        }
    }

    getStatusBadgeClass(status: string | undefined): string {
        switch (status) {
            case 'ACTIVE': return 'badge-active';
            case 'EXPIRED': return 'badge-expired';
            default: return 'badge-default';
        }
    }

    getStatusLabel(status: string | undefined): string {
        switch (status) {
            case 'ACTIVE': return 'Đang hoạt động';
            case 'EXPIRED': return 'Hết hạn';
            default: return status || 'Không xác định';
        }
    }
}
