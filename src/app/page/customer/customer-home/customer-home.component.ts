import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CustomerWarehouseService } from '../../../service/customer-warehouse.service';

@Component({
    selector: 'app-customer-home',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './customer-home.component.html',
    styleUrl: './customer-home.component.css'
})
export class CustomerHomeComponent implements OnInit {
    customerName: string = '';
    todayStr: string = '';

    stats = {
        totalWarehouseImports: 0,
        totalDisbursements: 0,
        totalGuarantees: 0,
    };

    loading = true;

    constructor(private warehouseService: CustomerWarehouseService) {
        this.customerName = localStorage.getItem('fullName') || 'Khách hàng';
        const now = new Date();
        this.todayStr = now.toLocaleDateString('vi-VN', {
            weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric'
        });
    }

    ngOnInit(): void {
        this.loadStats();
    }

    loadStats(): void {
        this.warehouseService.getMyWarehouseImports(0, 1).subscribe({
            next: (res) => {
                this.stats.totalWarehouseImports = res.totalElements;
            },
            error: () => { }
        });

        this.warehouseService.getMyDisbursements(0, 1).subscribe({
            next: (res) => {
                this.stats.totalDisbursements = res.totalElements;
                this.loading = false;
            },
            error: () => { this.loading = false; }
        });
    }
}
