import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { GuaranteeLetterService } from '../../../service/guarantee-letter.service';
import { GuaranteeLetter } from '../../../models/guarantee_letter';
import { PageResponse } from '../../../models/page-response';
import { ManufacturerService } from '../../../service/manufacturer.service';
import { Manufacturer } from '../../../models/manufacturer';

@Component({
    selector: 'app-thong-ke-bao-lanh',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './thong-ke-bao-lanh.component.html',
    styleUrl: './thong-ke-bao-lanh.component.css'
})
export class ThongKeBaoLanhComponent implements OnInit {
    // Data
    guaranteeLetters: GuaranteeLetter[] = [];
    manufacturers: Manufacturer[] = [];

    // Stats
    totalExpectedAmount = 0;
    totalActualAmount = 0;
    totalRemainingAmount = 0;
    totalExpectedVehicles = 0;
    totalImportedVehicles = 0;

    // Filters
    keyword = '';
    selectedManufacturer = '';
    statusFilter: 'all' | 'valid' | 'expired' = 'all';

    // Pagination
    currentPage = 0;
    pageSize = 10;
    totalElements = 0;
    isLoading = false;

    constructor(
        private guaranteeService: GuaranteeLetterService,
        private manufacturerService: ManufacturerService
    ) { }

    ngOnInit(): void {
        this.loadManufacturers();
        this.loadData();
    }

    loadManufacturers(): void {
        this.manufacturerService.getManufacture().subscribe((res: Manufacturer[]) => {
            this.manufacturers = res;
        });
    }

    loadData(): void {
        this.isLoading = true;
        this.guaranteeService.search(
            this.keyword,
            this.selectedManufacturer,
            undefined,
            undefined,
            undefined,
            this.currentPage,
            this.pageSize
        ).subscribe({
            next: (res: PageResponse<GuaranteeLetter>) => {
                this.guaranteeLetters = this.applyStatusFilter(res.content);
                this.totalElements = res.totalElements;
                this.calculateStats(res.content);
                this.isLoading = false;
            },
            error: () => {
                this.isLoading = false;
            }
        });
    }

    applyStatusFilter(data: GuaranteeLetter[]): GuaranteeLetter[] {
        const now = new Date();
        if (this.statusFilter === 'all') return data;

        return data.filter(item => {
            if (!item.expiryDate) return this.statusFilter === 'valid';
            const expiry = new Date(item.expiryDate);
            return this.statusFilter === 'valid' ? expiry >= now : expiry < now;
        });
    }

    calculateStats(data: GuaranteeLetter[]): void {
        this.totalExpectedAmount = data.reduce((sum, item) => sum + (item.expectedGuaranteeAmount || 0), 0);
        this.totalActualAmount = data.reduce((sum, item) => sum + (item.totalGuaranteeAmount || 0), 0);
        this.totalRemainingAmount = data.reduce((sum, item) => sum + (item.remainingAmount || 0), 0);
        this.totalExpectedVehicles = data.reduce((sum, item) => sum + (item.expectedVehicleCount || 0), 0);
        this.totalImportedVehicles = data.reduce((sum, item) => sum + (item.importedVehicleCount || 0), 0);
    }

    onSearch(): void {
        this.currentPage = 0;
        this.loadData();
    }

    onPageChange(page: number): void {
        this.currentPage = page;
        this.loadData();
    }

    isExpired(dateStr?: string): boolean {
        if (!dateStr) return false;
        return new Date(dateStr) < new Date();
    }

    formatDate(dateStr?: string): string {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('vi-VN');
    }
}
