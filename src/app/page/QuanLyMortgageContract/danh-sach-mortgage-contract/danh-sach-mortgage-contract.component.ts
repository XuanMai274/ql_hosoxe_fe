import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MortgageContract } from '../../../models/mortgage-contract.model';
import { MortgageContractService } from '../../../service/mortgage-contract.service';

@Component({
    selector: 'app-danh-sach-mortgage-contract',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './danh-sach-mortgage-contract.component.html',
    styleUrls: ['./danh-sach-mortgage-contract.component.css']
})
export class DanhSachMortgageContractComponent implements OnInit {
    contracts: MortgageContract[] = [];
    filteredContracts: MortgageContract[] = [];
    isLoading = false;

    // Search & Filter
    searchTerm: string = '';
    statusFilter: string = '';

    stats = {
        totalContracts: 0,
        totalValue: 0,
        activeContracts: 0
    };

    constructor(
        private mortgageContractService: MortgageContractService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loadContracts();
    }

    loadContracts(): void {
        this.isLoading = true;
        this.mortgageContractService.getMortgageContracts().subscribe({
            next: (data) => {
                this.contracts = data;
                this.applyFilter();
                this.calculateStats();
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading mortgage contracts', err);
                this.isLoading = false;
            }
        });
    }

    applyFilter(): void {
        this.filteredContracts = this.contracts.filter(c => {
            const matchesSearch = !this.searchTerm ||
                c.contractNumber?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                c.customerDTO?.customerName?.toLowerCase().includes(this.searchTerm.toLowerCase());
            const matchesStatus = !this.statusFilter || c.status === this.statusFilter;
            return matchesSearch && matchesStatus;
        });
    }

    calculateStats(): void {
        this.stats.totalContracts = this.contracts.length;
        this.stats.totalValue = this.contracts.reduce((sum, c) => sum + (c.totalCollateralValue || 0), 0);
        this.stats.activeContracts = this.contracts.filter(c => c.status === 'ACTIVE').length;
    }

    onSearch(): void {
        this.applyFilter();
    }

    goToAdd(): void {
        this.router.navigate(['/manager/mortgage-contract/add']);
    }

    goToEdit(id: number): void {
        this.router.navigate(['/manager/mortgage-contract/edit', id]);
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
            case 'ACTIVE': return 'status-active';
            case 'EXPIRED': return 'status-expired';
            default: return 'status-default';
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
