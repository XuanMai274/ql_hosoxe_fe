import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WarehouseExportService } from '../../../service/warehouse-export.service';
import { WarehouseExportDTO } from '../../../models/warehouseExport.model';
import Swal from 'sweetalert2';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
    selector: 'app-quan-ly-xuat-kho',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './quan-ly-xuat-kho.component.html',
    styleUrls: ['./quan-ly-xuat-kho.component.css']
})
export class QuanLyXuatKhoComponent implements OnInit {
    list: WarehouseExportDTO[] = [];
    loading = false;
    error: string | null = null;

    // Pagination
    page = 0;
    size = 10;
    totalElements = 0;
    totalPages = 0;

    // Search
    exportNumber = '';

    // Detail Modal
    showDetail = false;
    selectedItem: WarehouseExportDTO | null = null;
    isEditMode = false;

    private searchSubject = new Subject<string>();

    constructor(private warehouseExportService: WarehouseExportService) {
        this.searchSubject.pipe(
            debounceTime(500),
            distinctUntilChanged()
        ).subscribe(() => {
            this.page = 0;
            this.loadData();
        });
    }

    ngOnInit(): void {
        this.loadData();
    }

    loadData(): void {
        this.loading = true;
        this.error = null;

        const params: any = {
            page: this.page,
            size: this.size,
        };

        if (this.exportNumber && this.exportNumber.trim() !== '') {
            params.exportNumber = this.exportNumber;
        }

        this.warehouseExportService.getAll(params).subscribe({
            next: (res: any) => {
                this.list = res.content || [];
                this.totalElements = res.totalElements || 0;
                this.totalPages = res.totalPages || 0;
                this.loading = false;
            },
            error: (err: any) => {
                console.error(err);
                this.error = 'Không thể tải danh sách phiếu xuất kho. Vui lòng thử lại sau.';
                this.loading = false;
            }
        });
    }

    onSearch(value: string): void {
        const val = value ? value.trim() : '';
        this.exportNumber = val;
        if (!val) {
            this.page = 0;
            this.loadData();
        } else {
            this.searchSubject.next(val);
        }
    }

    next(): void {
        if (this.page + 1 < this.totalPages) {
            this.page++;
            this.loadData();
        }
    }

    prev(): void {
        if (this.page > 0) {
            this.page--;
            this.loadData();
        }
    }

    openDetail(item: WarehouseExportDTO): void {
        this.selectedItem = JSON.parse(JSON.stringify(item));
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

        Swal.fire({
            title: 'Xác nhận lưu?',
            text: 'Bạn có chắc chắn muốn cập nhật thông tin phiếu xuất kho này?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#0d9488',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Đồng ý',
            cancelButtonText: 'Hủy'
        }).then((result) => {
            if (result.isConfirmed) {
                this.warehouseExportService.update(this.selectedItem!.id!, this.selectedItem).subscribe({
                    next: () => {
                        Swal.fire('Thành công', 'Đã cập nhật thông tin phiếu xuất kho.', 'success');
                        this.loadData();
                        this.closeDetail();
                    },
                    error: (err: any) => {
                        console.error(err);
                        Swal.fire('Lỗi', 'Không thể cập nhật thông tin.', 'error');
                    }
                });
            }
        });
    }

    formatDate(date: any): string {
        if (!date) return '—';
        return new Date(date).toLocaleString('vi-VN');
    }

    formatCurrency(value: any): string {
        if (value === null || value === undefined) return '0 ₫';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
    }

    getVehicleStatusClass(status: string | undefined): string {
        if (!status) return 'status-default';
        const s = status.toLowerCase();
        if (s.includes('đã trả')) return 'status-success';
        if (s.includes('chờ')) return 'status-warning';
        return 'status-info';
    }

    getStatusClass(status: string | undefined): string {
        if (!status) return 'status-default';
        const s = status.toUpperCase();
        if (s === 'APPROVED') return 'status-success';
        if (s === 'PENDING') return 'status-warning';
        if (s === 'REJECTED') return 'status-danger';
        return 'status-info';
    }
}
