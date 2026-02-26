import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OfficerGuaranteeService } from '../../../service/officer-guarantee.service';
import { GuaranteeLetter } from '../../../models/guarantee_letter';
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
    applications: GuaranteeLetter[] = [];
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
            next: (response: PageResponse<GuaranteeLetter>) => {
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

    onApprove(app: GuaranteeLetter): void {
        Swal.fire({
            title: 'Xác nhận duyệt',
            text: `Bạn có chắc chắn muốn duyệt hồ sơ của khách hàng ${app.customerDTO?.customerName}?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Duyệt',
            cancelButtonText: 'Hủy',
            confirmButtonColor: '#028B89'
        }).then((result) => {
            if (result.isConfirmed) {
                this.officerGuaranteeService.approveApplication(app.id!).subscribe({
                    next: () => {
                        Swal.fire('Thành công', 'Đã duyệt hồ sơ bảo lãnh', 'success');
                        // Sau khi duyệt thành công, chuyển sang bước tạo đề nghị bảo lãnh
                        // Truyền ID để FE có thể load dữ liệu từ đơn này
                        this.router.navigate(['/manager/them-bao-lanh'], { queryParams: { applicationId: app.id } });
                    },
                    error: (err) => {
                        Swal.fire('Lỗi', err.error?.message || 'Không thể duyệt hồ sơ', 'error');
                    }
                });
            }
        });
    }

    onReject(app: GuaranteeLetter): void {
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
        switch (status.toLowerCase()) {
            case 'pending': return 'status-pending';
            case 'approved': return 'status-approved';
            case 'rejected': return 'status-rejected';
            default: return 'status-default';
        }
    }

    getStatusText(status: string | undefined): string {
        if (!status) return 'Không xác định';
        switch (status.toLowerCase()) {
            case 'pending': return 'Chờ duyệt';
            case 'approved': return 'Đã duyệt';
            case 'rejected': return 'Đã từ chối';
            default: return status;
        }
    }
}
