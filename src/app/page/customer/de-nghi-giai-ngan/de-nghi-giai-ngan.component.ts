import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomerWarehouseService } from '../../../service/customer-warehouse.service';

@Component({
  selector: 'app-de-nghi-giai-ngan',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './de-nghi-giai-ngan.component.html',
  styleUrl: './de-nghi-giai-ngan.component.css'
})
export class DeNghiGiaiNganComponent implements OnInit {

  groups: any[] = [];
  loading = true;
  error = '';

  // Modal chi tiết
  showDetail = false;
  selectedGroup: any | null = null;

  constructor(private service: CustomerWarehouseService) { }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.error = '';
    this.service.getMyDisbursements().subscribe({
      next: (data) => {
        // Map DisbursementDTO sang cấu trúc HTML mong đợi nếu cần
        this.groups = data.map(d => ({
          ...d,
          contractNumber: d.mortgageContractDTO?.contractNumber || '—',
          totalAmount: d.disbursementAmount || 0,
          latestDate: d.disbursementDate
        }));
        this.loading = false;
      },
      error: (err) => {
        console.error('Lỗi load giải ngân:', err);
        this.error = 'Không thể tải dữ liệu. Vui lòng thử lại.';
        this.loading = false;
      }
    });
  }

  openDetail(group: any): void {
    this.selectedGroup = group;
    this.showDetail = true;
    document.body.style.overflow = 'hidden';
  }

  closeDetail(): void {
    this.showDetail = false;
    this.selectedGroup = null;
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
    return this.groups.reduce((s, g) => s + (g.totalAmount || 0), 0);
  }
}
