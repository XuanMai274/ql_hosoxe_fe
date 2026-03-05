import { Component } from '@angular/core';
import { VehicleService } from '../../../service/vehicle.service';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DocumentService } from '../../../service/document.service';
import { CommonModule } from '@angular/common';
import { PageResponse } from '../../../models/page-response';
import { VehicleList } from '../../../models/vehiclelist.model';
import { Subject, debounceTime } from 'rxjs';

@Component({
    selector: 'app-danh-sach-xe',
    standalone: true,
    imports: [ReactiveFormsModule, CommonModule, FormsModule],
    templateUrl: './danh-sach-xe.component.html',
    styleUrl: './danh-sach-xe.component.css'
})
export class DanhSachXeComponent {
    vehicles: VehicleList[] = [];
    loading = false;

    // filter
    chassisNumber = '';
    status = '';
    manufacturer = '';
    ref = '';

    // paging
    page = 0;
    size = 10;
    totalPages = 0;

    private searchSubject = new Subject<void>();

    constructor(
        private vehicleService: VehicleService,
        private documentService: DocumentService,
        private router: Router
    ) {
        this.searchSubject.pipe(
            debounceTime(500)
        ).subscribe(() => {
            this.page = 0;
            this.loadVehicles();
        });
    }

    ngOnInit(): void {
        this.loadVehicles();
    }

    loadVehicles(): void {
        this.loading = true;
        this.vehicleService.getVehiclesForCustomer({
            chassisNumber: this.chassisNumber || undefined,
            status: this.status || undefined,
            manufacturer: this.manufacturer || undefined,
            ref: this.ref,
            page: this.page,
            size: this.size
        }).subscribe({
            next: (res: PageResponse<VehicleList>) => {
                this.vehicles = res.content;
                this.totalPages = res.totalPages;
                this.loading = false;
            },
            error: () => {
                this.loading = false;
            }
        });
    }

    onSearch(): void {
        this.searchSubject.next();
    }

    resetFilter(): void {
        this.chassisNumber = '';
        this.status = '';
        this.manufacturer = '';
        this.ref = '';
        this.page = 0;
        this.loadVehicles();
    }

    changePage(p: number): void {
        if (p < 0 || p >= this.totalPages) return;
        this.page = p;
        this.loadVehicles();
    }

    viewCocVat(vehicleId: number): void {
        this.documentService.previewLatestDocCustomer(vehicleId).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                window.open(url, '_blank');
            },
            error: (err) => {
                console.error('Lỗi khi xem file:', err);
            }
        });
    }
}
