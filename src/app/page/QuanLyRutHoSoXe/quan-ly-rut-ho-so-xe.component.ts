import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WarehouseExportService } from '../../service/warehouse-export.service';
import { WarehouseExportDTO } from '../../models/warehouseExport.model';
import { Vehicle } from '../../models/vehicle';

import { switchMap, of } from 'rxjs';
import { DisbursementDTO } from '../../models/disbursement.model';

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
    interestModalVisible = false;
    disbursementsNeedInterest: DisbursementDTO[] = [];
    interestFormData: { disbursementId: number; interestAmount: number }[] = [];
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

        if (request.id) {
            this.exportService.getVehiclesByExportId(request.id).subscribe({
                next: (data) => {
                    this.vehicles = data;
                    console.log("dữ liệu xe thuộc đơn đề nghị", data)
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

    // =============================
    //  APPROVE FLOW ENTRY POINT
    // =============================

    approveRequest(): void {

        if (!this.selectedRequest) return;
        if (!confirm('Bạn có chắc chắn muốn duyệt đơn này?')) return;

        if (!this.vehicles || this.vehicles.length === 0) {
            alert('Chưa có danh sách xe.');
            return;
        }

        const loanIds = this.vehicles
            .map(v => v.loan?.id)
            .filter((id): id is number => !!id);

        if (loanIds.length === 0) {
            this.executeApproveFlow();
            return;
        }

        this.exportService
            .checkDisbursementNeedInterest(loanIds)
            .subscribe({
                next: (list) => {

                    if (!list || list.length === 0) {
                        this.executeApproveFlow();
                    } else {

                        this.disbursementsNeedInterest = list;

                        this.interestFormData = list.map(d => ({
                            disbursementId: d.id!,
                            interestAmount: 0
                        }));

                        this.interestModalVisible = true;
                    }
                },
                error: (err) => {
                    console.error('Check interest error:', err);
                    alert('Lỗi khi kiểm tra lãi.');
                }
            });
    }

    // =========================================
    //  XÁC NHẬN NHẬP LÃI → UPDATE → APPROVE
    // =========================================

    confirmInterestAndApprove(): void {

        if (!this.interestFormData || this.interestFormData.length === 0) {
            alert('Không có dữ liệu lãi.');
            return;
        }

        const invalid = this.interestFormData.some(i => i.interestAmount < 0);
        if (invalid) {
            alert('Lãi không hợp lệ.');
            return;
        }

        // 1️ Update lãi
        this.exportService
            .updateInterestForDisbursements(this.interestFormData)
            .subscribe({
                next: () => {
                    // 2️⃣ Sau khi update thành công → duyệt
                    this.executeApproveFlow();
                },
                error: (err) => {
                    console.error('Update interest error:', err);
                    alert('Cập nhật lãi thất bại.');
                }
            });
    }

    // =====================================
    // APPROVE + EXPORT 
    // =====================================

    private executeApproveFlow(): void {

        if (!this.selectedRequest) return;

        this.exportService.approveExport(this.selectedRequest).pipe(

            switchMap((approvedResult) => {
                this.selectedRequest = approvedResult;
                return this.exportService.exportAllFiles(approvedResult);
            })

        ).subscribe({

            next: (blob: Blob) => {

                const now = new Date();
                const fileName =
                    `XuatKho_${String(now.getDate()).padStart(2, '0')}_` +
                    `${String(now.getMonth() + 1).padStart(2, '0')}_` +
                    `${now.getFullYear()}`;

                this.downloadFile(blob, `${fileName}.zip`);

                alert('Duyệt và xuất hồ sơ thành công.');

                this.interestModalVisible = false;
                this.closeDetails();
                this.loadPendingRequests();
            },

            error: (err) => {
                console.error('Approve/Export error:', err);
                alert('Có lỗi trong quá trình duyệt hoặc xuất file.');
            }
        });
    }

    // =============================
    // UTIL
    // =============================

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
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(value);
    }

    formatNumber(value: number | undefined | null): string {
        if (!value) return '';
        return new Intl.NumberFormat('vi-VN').format(value);
    }

    onMoneyChange(value: string, field: 'totalCollateralValue' | 'realEstateValue'): void {
        if (!this.selectedRequest) return;

        const rawValue = value.replace(/\./g, '');
        const numericValue = Number(rawValue);

        if (!isNaN(numericValue)) {
            this.selectedRequest[field] = numericValue;
        }
    }
    onInterestChange(value: string, index: number): void {
        const rawValue = value.replace(/\./g, '');
        const numericValue = Number(rawValue);

        if (!isNaN(numericValue)) {
            this.interestFormData[index].interestAmount = numericValue;
        }
    }
}