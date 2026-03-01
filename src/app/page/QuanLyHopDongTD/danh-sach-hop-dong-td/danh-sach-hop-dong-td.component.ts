import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CreditContract } from '../../../models/credit_contract';
import { CreditContractService } from '../../../service/credit_contract.service';

@Component({
    selector: 'app-danh-sach-hop-dong-td',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './danh-sach-hop-dong-td.component.html',
    styleUrl: './danh-sach-hop-dong-td.component.css'
})
export class DanhSachHopDongTDComponent implements OnInit {
    contracts: CreditContract[] = [];
    filteredContracts: CreditContract[] = [];
    isLoading = false;

    // Search & Filter
    searchTerm: string = '';
    statusFilter: string = '';

    // Quick Stats
    stats = {
        totalContracts: 0,
        totalLimit: 0,
        totalUsed: 0,
        totalRemaining: 0
    };

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
                this.applyFilter();
                this.calculateStats();
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading contracts', err);
                this.isLoading = false;
            }
        });
    }

    calculateStats(): void {
        this.stats.totalContracts = this.contracts.length;
        this.stats.totalLimit = this.contracts.reduce((acc, c) => acc + (c.creditLimit || 0), 0);
        this.stats.totalUsed = this.contracts.reduce((acc, c) => acc + (c.usedLimit || 0), 0);
        this.stats.totalRemaining = this.contracts.reduce((acc, c) => acc + (c.remainingLimit || 0), 0);
    }

    applyFilter(): void {
        this.filteredContracts = this.contracts.filter(c => {
            const matchesSearch = !this.searchTerm ||
                c.contractNumber?.toLowerCase().includes(this.searchTerm.toLowerCase());
            const matchesStatus = !this.statusFilter || c.status === this.statusFilter;
            return matchesSearch && matchesStatus;
        });
    }

    onSearch(event: any): void {
        this.searchTerm = event.target.value;
        this.applyFilter();
    }

    onStatusFilterChange(event: any): void {
        this.statusFilter = event.target.value;
        this.applyFilter();
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
            if (isNaN(date.getTime())) return dateStr;
            const d = date.getDate().toString().padStart(2, '0');
            const m = (date.getMonth() + 1).toString().padStart(2, '0');
            const y = date.getFullYear();
            return `${d}/${m}/${y}`;
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
