import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OfficerGuaranteeService } from '../../../service/officer-guarantee.service';
import { GuaranteeApplication } from '../../../models/guarantee_application.model';
import { PageResponse } from '../../../models/page-response';
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
    applications: GuaranteeApplication[] = [];
    isLoading = false;
    currentPage = 0;
    pageSize = 10;
    totalElements = 0;

    constructor(
        private officerGuaranteeService: OfficerGuaranteeService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loadApplications();
    }

    loadApplications(): void {
        this.isLoading = true;
        this.officerGuaranteeService.getGuaranteeApplications(this.currentPage, this.pageSize).subscribe({
            next: (response: PageResponse<GuaranteeApplication>) => {
                this.applications = response.content;
                this.totalElements = response.totalElements;
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading applications:', err);
                this.isLoading = false;
                Swal.fire('Lỗi', 'Không thể tải danh sách hồ sơ bảo lãnh', 'error');
            }
        });
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
                        Swal.fire('Đã từ chối', 'Đơn hàng đã được chuyển trạng thái từ chối', 'info');
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

    getStatusClass(status: string | undefined): string {
        if (!status) return 'status-default';
        const s = status.toLowerCase();
        if (s === 'pending' || s === 'pending_approval') return 'status-pending';
        switch (s) {
            case 'approved': return 'status-approved';
            case 'rejected': return 'status-rejected';
            default: return 'status-default';
        }
    }

    getStatusText(status: string | undefined): string {
        if (!status) return 'Không xác định';
        const s = status.toLowerCase();
        if (s === 'pending' || s === 'pending_approval') return 'Chờ duyệt';
        switch (s) {
            case 'approved': return 'Đã duyệt';
            case 'rejected': return 'Đã từ chối';
            default: return status;
        }
    }
}
