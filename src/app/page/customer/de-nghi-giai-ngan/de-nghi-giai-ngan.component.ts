import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomerWarehouseService } from '../../../service/customer-warehouse.service';
import { LoanDTO } from '../../../models/loan.model';

/** Nhóm giải ngân - tương đương một "disbursement" cha, gồm nhiều loan con */
export interface DisbursementGroup {
  contractNumber: string;       // Số hợp đồng tín dụng cha
  creditContractId?: number;
  loans: LoanDTO[];
  totalAmount: number;
  loanContractNumber: string;  // Số HĐTD chi tiết (đơn con đầu tiên)
  latestDate?: string;         // Ngày giải ngân mới nhất
}

@Component({
  selector: 'app-de-nghi-giai-ngan',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './de-nghi-giai-ngan.component.html',
  styleUrl: './de-nghi-giai-ngan.component.css'
})
export class DeNghiGiaiNganComponent implements OnInit {

  allLoans: LoanDTO[] = [];
  groups: DisbursementGroup[] = [];
  loading = true;
  error = '';

  // Modal chi tiết
  showDetail = false;
  selectedGroup: DisbursementGroup | null = null;

  constructor(private service: CustomerWarehouseService) { }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.error = '';
    this.service.getMyLoans().subscribe({
      next: (data) => {
        this.allLoans = data;
        this.buildGroups(data);
        this.loading = false;
      },
      error: (err) => {
        console.error('Lỗi load giải ngân:', err);
        this.error = 'Không thể tải dữ liệu. Vui lòng thử lại.';
        this.loading = false;
      }
    });
  }

  /** Group loans theo loanContractNumber (mỗi đợt giải ngân = 1 số HĐTDCT) */
  buildGroups(loans: LoanDTO[]): void {
    const map = new Map<string, LoanDTO[]>();

    for (const loan of loans) {
      const key = loan.loanContractNumber || 'unknown';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(loan);
    }

    this.groups = Array.from(map.entries()).map(([loanContractNumber, groupLoans]) => {
      const totalAmount = groupLoans.reduce((s, l) => s + (l.loanAmount || 0), 0);
      const dates = groupLoans
        .map(l => l.createdAt)
        .filter(d => !!d)
        .sort();

      return {
        contractNumber: groupLoans[0]?.creditContractDTO?.contractNumber || '—',
        creditContractId: groupLoans[0]?.creditContractDTO?.id,
        loanContractNumber,
        loans: groupLoans,
        totalAmount,
        latestDate: dates.length > 0 ? dates[dates.length - 1] : undefined
      };
    });

    // Sort by date desc
    this.groups.sort((a, b) => {
      if (!a.latestDate) return 1;
      if (!b.latestDate) return -1;
      return new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime();
    });
  }

  openDetail(group: DisbursementGroup): void {
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
    return this.allLoans.reduce((s, l) => s + (l.loanAmount || 0), 0);
  }
}
