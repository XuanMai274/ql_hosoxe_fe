import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomerWarehouseService } from '../../../service/customer-warehouse.service';
import { DisbursementDTO } from '../../../models/disbursement.model';
import { DisbursementExportRequest } from '../../../models/disbursement-export-request';

@Component({
  selector: 'app-de-nghi-giai-ngan',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './de-nghi-giai-ngan.component.html',
  styleUrl: './de-nghi-giai-ngan.component.css'
})
export class DeNghiGiaiNganComponent implements OnInit {
  exporting = false;
  list: DisbursementDTO[] = [];
  loading = true;
  error = '';

  // Phân trang
  page = 0;
  size = 10;
  totalPages = 0;
  totalElements = 0;

  // Modal chi tiết
  showDetail = false;
  selectedItem: DisbursementDTO | null = null;

  constructor(private customerWarehouseService: CustomerWarehouseService) { }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(page: number = 0): void {
    this.page = page;
    this.loading = true;
    this.error = '';
    this.customerWarehouseService.getMyDisbursements(this.page, this.size).subscribe({
      next: (res) => {
        this.list = res.content;
        this.totalPages = res.totalPages;
        this.totalElements = res.totalElements;
        this.loading = false;
      },
      error: (err) => {
        console.error('Lỗi load giải ngân:', err);
        this.error = 'Không thể tải dữ liệu. Vui lòng thử lại.';
        this.loading = false;
      }
    });
  }
  exportFile(): void {

    if (!this.selectedItem) return;

    const vehicleIds = this.selectedItem.loans
      ?.map(l => l.vehicleDTO?.id!)
      ?.filter(Boolean) as number[] || [];

    if (vehicleIds.length === 0) {
      alert('Không có phương tiện để xuất.');
      return;
    }

    const request: DisbursementExportRequest = {
      disbursementDTO: this.selectedItem,
      vehicleIds: vehicleIds
    };
    console.log("dữ liệu gửi đi xuất file: " ,request)
    this.
      customerWarehouseService.exportSpecificGN(request)
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `HoSoGiaiNgan_${Date.now()}.zip`;
          link.click();
          window.URL.revokeObjectURL(url);
          this.exporting = false;
        },
        error: () => {
          alert('Xuất file thất bại.');
          this.exporting = false;
        }
      });
  }


  next() {
    if (this.page + 1 < this.totalPages) {
      this.loadData(this.page + 1);
    }
  }

  prev() {
    if (this.page > 0) {
      this.loadData(this.page - 1);
    }
  }

  openDetail(item: DisbursementDTO): void {
    this.selectedItem = item;
    this.showDetail = true;
    document.body.style.overflow = 'hidden';
  }

  closeDetail(): void {
    this.showDetail = false;
    this.selectedItem = null;
    document.body.style.overflow = '';
  }

  formatCurrency(amount?: number): string {
    if (!amount) return '—';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('vi-VN');
  }

  getLoanStatusClass(status?: string): string {
    switch (status?.toUpperCase()) {
      case 'ACTIVE': return 'status-active';
      case 'PAID': return 'status-paid';
      case 'OVERDUE': return 'status-overdue';
      default: return 'status-default';
    }
  }

  getLoanStatusLabel(status?: string): string {
    switch (status?.toUpperCase()) {
      case 'ACTIVE': return 'Đang vay';
      case 'PAID': return 'Đã trả';
      case 'OVERDUE': return 'Quá hạn';
      default: return status || '—';
    }
  }

  get totalDisbursed(): number {
    return this.list.reduce((s, g) => s + (g.disbursementAmount || 0), 0);
  }
}
