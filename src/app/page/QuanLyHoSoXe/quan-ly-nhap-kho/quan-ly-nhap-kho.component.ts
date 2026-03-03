import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { WarehouseService } from '../../../service/warehouse.service';
import { WarehouseImportDTO } from '../../../models/warehouseImport.model';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-quan-ly-nhap-kho',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    templateUrl: './quan-ly-nhap-kho.component.html',
    styleUrl: './quan-ly-nhap-kho.component.css'
})
export class QuanLyNhapKhoComponent implements OnInit {
    list: WarehouseImportDTO[] = [];
    loading = false;
    error = '';

    // Pagination
    page = 0;
    size = 10;
    totalElements = 0;
    totalPages = 0;

    // Search
    importNumber = '';

    // Detail & Edit
    showDetail = false;
    isEditMode = false;
    selectedItem: WarehouseImportDTO | null = null;
    loadingDetail = false;

    constructor(private warehouseService: WarehouseService) { }

    ngOnInit(): void {
        this.loadData();
    }

    loadData(): void {
        this.loading = true;
        this.error = '';
        const params = {
            page: this.page,
            size: this.size,
            importNumber: this.importNumber || ''
        };

        this.warehouseService.getAll(params).subscribe({
            next: (res) => {
                this.list = res.content;
                this.totalElements = res.totalElements;
                this.totalPages = res.totalPages;
                this.loading = false;
            },
            error: (err: any) => {
                this.error = 'Không thể tải danh sách phiếu nhập kho';
                this.loading = false;
                console.error(err);
            }
        });
    }

    search(): void {
        this.page = 0;
        this.loadData();
    }

    prev(): void {
        if (this.page > 0) {
            this.page--;
            this.loadData();
        }
    }

    next(): void {
        if (this.page + 1 < this.totalPages) {
            this.page++;
            this.loadData();
        }
    }

    openDetail(item: WarehouseImportDTO): void {
        this.selectedItem = { ...item };
        this.showDetail = true;
        this.isEditMode = false;
    }

    closeDetail(): void {
        this.showDetail = false;
        this.selectedItem = null;
        this.isEditMode = false;
    }

    toggleEdit(): void {
        this.isEditMode = !this.isEditMode;
    }

    saveEdit(): void {
        if (!this.selectedItem || !this.selectedItem.id) return;

        this.loadingDetail = true;
        this.warehouseService.update(this.selectedItem.id, this.selectedItem).subscribe({
            next: (res) => {
                Swal.fire('Thành công', 'Đã cập nhật phiếu nhập kho', 'success');
                this.loadData();
                this.closeDetail();
                this.loadingDetail = false;
            },
            error: (err: any) => {
                Swal.fire('Lỗi', 'Không thể cập nhật phiếu nhập kho', 'error');
                this.loadingDetail = false;
            }
        });
    }

    formatDate(date: any): string {
        if (!date) return '—';
        return new Date(date).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatCurrency(value: number | undefined): string {
        if (value === undefined || value === null) return '0 ₫';
        return value.toLocaleString('vi-VN') + ' ₫';
    }

    getManufacturerClass(item: any): string {
        const code = item.manufacturerDTO?.code?.toLowerCase();
        if (code?.includes('hyundai')) return 'tag-hyundai';
        if (code?.includes('vinfast')) return 'tag-vinfast';
        return 'tag-default';
    }

    getVehicleStatusClass(status: string | undefined): string {
        if (!status) return 'status-default';
        if (status === 'Giữ két') return 'status-két';
        if (status === 'Giữ trong kho') return 'status-kho';
        return 'status-other';
    }
}
