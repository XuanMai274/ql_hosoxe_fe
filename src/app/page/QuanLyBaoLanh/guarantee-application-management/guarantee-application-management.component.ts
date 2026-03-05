import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OfficerGuaranteeService } from '../../../service/officer-guarantee.service';
import { GuaranteeApplication } from '../../../models/guarantee_application.model';
import { PageResponse } from '../../../models/page-response';
import { GuaranteeStatistics } from '../../../models/guarantee_statistics.model';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';

@Component({
    selector: 'app-guarantee-application-management',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './guarantee-application-management.component.html',
    styleUrl: './guarantee-application-management.component.css'
})
export class GuaranteeApplicationManagementComponent implements OnInit {
    get totalPages(): number {
        return Math.ceil(this.totalElements / this.pageSize);
    }
    applications: GuaranteeApplication[] = [];
    isLoading = false;
    currentPage = 0;
    pageSize = 10;
    totalElements = 0;
    selectedStatus = '';

    showDetailModal = false;
    selectedApp: GuaranteeApplication | null = null;
    isLoadingDetail = false;

    // History Modal
    showHistoryModal = false;
    historyApplications: GuaranteeApplication[] = [];
    historyTotalElements = 0;
    historyCurrentPage = 0;
    historySelectedStatus = '';
    isHistoryLoading = false;

    statistics: GuaranteeStatistics = {
        totalVehicles: 0,
        inWarehouseCount: 0,
        disbursedCount: 0
    };

    constructor(
        private officerGuaranteeService: OfficerGuaranteeService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loadApplications();
        this.fetchStatistics();
    }

    fetchStatistics(): void {
        this.officerGuaranteeService.getStatistics().subscribe({
            next: (res) => {
                this.statistics = res;
            },
            error: (err: any) => {
                console.error('Error fetching statistics:', err);
            }
        });
    }

    loadApplications(): void {
        this.isLoading = true;
        this.officerGuaranteeService.getExcludeRejectedApplications(this.currentPage, this.pageSize, this.selectedStatus).subscribe({
            next: (response: PageResponse<GuaranteeApplication>) => {
                this.applications = response.content;
                this.totalElements = response.totalElements;
                this.isLoading = false;
            },
            error: (err: any) => {
                console.error('Error loading applications:', err);
                this.isLoading = false;
                Swal.fire('Lỗi', 'Không thể tải danh sách hồ sơ bảo lãnh', 'error');
            }
        });
    }

    onStatusChange(event: any): void {
        this.selectedStatus = event.target.value;
        this.currentPage = 0;
        this.loadApplications();
    }

    openDetail(item: GuaranteeApplication): void {
        if (!item.id) return;
        this.isLoadingDetail = true;
        this.showDetailModal = true;
        this.officerGuaranteeService.getApplicationById(item.id).subscribe({
            next: (res) => {
                this.selectedApp = res;
                this.isLoadingDetail = false;
            },
            error: (err: any) => {
                console.error('Error fetching details:', err);
                this.isLoadingDetail = false;
                Swal.fire('Lỗi', 'Không thể tải chi tiết hồ sơ', 'error');
            }
        });
    }

    closeDetail(): void {
        this.showDetailModal = false;
        this.selectedApp = null;
    }

    isPending(status: string | undefined): boolean {
        if (!status) return false;
        const s = status.toLowerCase();
        return s.includes('pending');
    }

    onApprove(app: GuaranteeApplication): void {
        // Chỉ chuyển sang bước lập hồ sơ bảo lãnh, không đổi trạng thái ngay
        this.router.navigate(['/manager/them-bao-lanh'], { queryParams: { applicationId: app.id } });
    }

    onReject(app: GuaranteeApplication): void {
        Swal.fire({
            title: 'Xác nhận từ chối',
            text: `Bạn có chắc chắn muốn từ chối hồ sơ này?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Từ chối',
            cancelButtonText: 'Hủy',
            confirmButtonColor: '#dc3545'
        }).then((result) => {
            if (result.isConfirmed) {
                this.officerGuaranteeService.rejectApplication(app.id!).subscribe({
                    next: () => {
                        Swal.fire('Đã từ chối', 'Đơn bảo lãnh đã được chuyển trạng thái từ chối', 'info');
                        this.loadApplications();
                    },
                    error: (err) => {
                        Swal.fire('Lỗi', err.error?.message || 'Không thể từ chối hồ sơ', 'error');
                    }
                });
            }
        });
    }

    onPageChange(page: number): void {
        this.currentPage = page;
        this.loadApplications();
    }

    // ===== HISTORY MODAL METHODS =====
    openHistory(): void {
        this.showHistoryModal = true;
        this.historyCurrentPage = 0;
        this.historySelectedStatus = '';
        this.loadHistory();
    }

    closeHistory(): void {
        this.showHistoryModal = false;
    }

    loadHistory(): void {
        this.isHistoryLoading = true;
        this.officerGuaranteeService.getGuaranteeApplications(
            this.historyCurrentPage,
            this.pageSize,
            this.historySelectedStatus
        ).subscribe({
            next: (response: PageResponse<GuaranteeApplication>) => {
                this.historyApplications = response.content;
                this.historyTotalElements = response.totalElements;
                this.isHistoryLoading = false;
            },
            error: (err: any) => {
                console.error('Error loading history:', err);
                this.isHistoryLoading = false;
                Swal.fire('Lỗi', 'Không thể tải lịch sử đơn bảo lãnh', 'error');
            }
        });
    }

    onHistoryStatusChange(event: any): void {
        this.historySelectedStatus = event.target.value;
        this.historyCurrentPage = 0;
        this.loadHistory();
    }

    onHistoryPageChange(page: number): void {
        this.historyCurrentPage = page;
        this.loadHistory();
    }

    getHistoryTotalPages(): number {
        return Math.ceil(this.historyTotalElements / this.pageSize);
    }

    getStatusClass(status: string | undefined): string {
        if (!status) return 'status-default';
        const s = status.toLowerCase();
        if (this.isPending(s)) return 'status-pending';
        switch (s) {
            case 'approved': return 'status-approved';
            case 'rejected': return 'status-rejected';
            default: return 'status-default';
        }
    }

    getStatusText(status: string | undefined): string {
        if (!status) return 'Không xác định';
        const s = status.toLowerCase();
        if (this.isPending(s)) return 'Chờ duyệt';
        switch (s) {
            case 'approved': return 'Đã duyệt';
            case 'rejected': return 'Đã từ chối';
            default: return status;
        }
    }
}
