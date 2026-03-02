import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WarehouseExportService } from '../../service/warehouse-export.service';
import { WarehouseExportDTO } from '../../models/warehouseExport.model';
import { Vehicle } from '../../models/vehicle';

@Component({
    selector: 'app-quan-ly-rut-ho-so-xe',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './quan-ly-rut-ho-so-xe.component.html',
    styleUrl: './quan-ly-rut-ho-so-xe.component.css'
})
export class QuanLyRutHoSoXeComponent implements OnInit {
    pendingRequests: WarehouseExportDTO[] = [];
    selectedRequest: WarehouseExportDTO | null = null;
    vehicles: Vehicle[] = [];
    loading = false;
    detailsLoading = false;

    constructor(private exportService: WarehouseExportService) { }

    ngOnInit(): void {
        this.loadPendingRequests();
    }

    loadPendingRequests(): void {
        this.loading = true;
        this.exportService.getPendingRequests().subscribe({
            next: (data) => {
                this.pendingRequests = data;
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading pending requests:', err);
                this.loading = false;
            }
        });
    }


    viewDetails(request: WarehouseExportDTO): void {
        this.selectedRequest = request;
        this.detailsLoading = true;
        this.vehicles = [];
        console.log("đã chọn", this.selectedRequest);
        if (request.id) {
            this.exportService.getVehiclesByExportId(request.id).subscribe({
                next: (data) => {
                    this.vehicles = data;
                    // Tinh tong tien thu no neu backend chua cung cap
                    if (!this.selectedRequest!.totalDebtCollection) {
                        const total = data.reduce((sum, v) => sum + (v.guaranteeAmount || 0), 0);
                        this.selectedRequest!.totalDebtCollection = total;
                    }

                    this.detailsLoading = false;
                },
                error: (err) => {
                    console.error('Error loading vehicles for request:', err);
                    this.detailsLoading = false;
                }
            });
        }

    }
    approveRequest(): void {

        if (!this.selectedRequest) return;

        if (!confirm('Bạn có chắc chắn muốn duyệt đơn này?')) return;

        // Gửi trực tiếp selectedRequest
        this.exportService.approveExport(this.selectedRequest).subscribe({

            next: (approvedResult: WarehouseExportDTO) => {

                // Cập nhật lại selectedRequest theo dữ liệu server trả về
                this.selectedRequest = approvedResult;
                const now = new Date();

                const fileName = `XuatKho_${String(now.getDate()).padStart(2, '0')
                    }_${String(now.getMonth() + 1).padStart(2, '0')
                    }_${now.getFullYear()
                    }`;
                // Sau khi approve thành công mới export
                this.exportService.exportAllFiles(approvedResult).subscribe({

                    next: (blob: Blob) => {

                        this.downloadFile(blob, `${fileName}_XuatKho.zip`);

                        alert('Duyệt và xuất hồ sơ thành công.');

                        this.closeDetails();
                        this.loadPendingRequests();
                    },

                    error: (err) => {
                        console.error('Export file error:', err);
                        alert('Duyệt thành công nhưng xuất file thất bại.');
                    }
                });
            },

            error: (err) => {
                console.error('Approve error:', err);
                alert('Có lỗi khi duyệt đơn.');
            }

        });
    }
    private downloadFile(blob: Blob, filename: string) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    closeDetails(): void {
        this.selectedRequest = null;
        this.vehicles = [];
    }

    rejectRequest(id: number | undefined): void {
        if (!id) return;

        if (confirm('Bạn có chắc chắn muốn từ chối đơn yêu cầu này?')) {
            this.exportService.rejectRequest(id).subscribe({
                next: () => {
                    alert('Đã từ chối đơn yêu cầu.');
                    this.closeDetails();
                    this.loadPendingRequests();
                },
                error: (err) => {
                    console.error('Error rejecting request:', err);
                    alert('Có lỗi xảy ra khi từ chối yêu cầu.');
                }
            });
        }
    }

    formatCurrency(value: number | undefined): string {
        if (value === undefined || value === null) return '0 ₫';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
    }
    formatNumber(value: number | undefined | null): string {
        if (!value) return '';
        return new Intl.NumberFormat('vi-VN').format(value);
    }

    onMoneyChange(value: string, field: 'totalCollateralValue' | 'realEstateValue'): void {
        if (!this.selectedRequest) return;

        // Bỏ dấu chấm
        const rawValue = value.replace(/\./g, '');

        const numericValue = Number(rawValue);

        if (!isNaN(numericValue)) {
            this.selectedRequest[field] = numericValue;
        }
    }
}
