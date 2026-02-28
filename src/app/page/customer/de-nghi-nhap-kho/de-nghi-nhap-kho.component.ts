import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomerWarehouseService } from '../../../service/customer-warehouse.service';
import { WarehouseImportDTO } from '../../../models/warehouseImport.model';
import { Vehicle } from '../../../models/vehicle';

@Component({
  selector: 'app-de-nghi-nhap-kho',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './de-nghi-nhap-kho.component.html',
  styleUrl: './de-nghi-nhap-kho.component.css'
})
export class DeNghiNhapKhoComponent implements OnInit {

  list: WarehouseImportDTO[] = [];
  loading = true;
  error = '';

  // Modal chi tiết
  showDetail = false;
  selectedItem: WarehouseImportDTO | null = null;
  loadingDetail = false;

  constructor(private service: CustomerWarehouseService) { }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.error = '';
    this.service.getMyWarehouseImports().subscribe({
      next: (data) => {
        this.list = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Lỗi load nhập kho:', err);
        this.error = 'Không thể tải dữ liệu. Vui lòng thử lại.';
        this.loading = false;
      }
    });
  }

  openDetail(item: WarehouseImportDTO): void {
    this.selectedItem = item;
    this.showDetail = true;
    document.body.style.overflow = 'hidden';

    // Nếu chưa có danh sách xe, load chi tiết
    if (!item.vehicles || item.vehicles.length === 0) {
      this.loadingDetail = true;
      this.service.getWarehouseImportDetail(item.id).subscribe({
        next: (detail) => {
          this.selectedItem = detail;
          this.loadingDetail = false;
        },
        error: () => {
          this.loadingDetail = false;
        }
      });
    }
  }

  closeDetail(): void {
    this.showDetail = false;
    this.selectedItem = null;
    document.body.style.overflow = '';
  }

  getManufacturerClass(item: WarehouseImportDTO): string {
    const code = item.manufacturerDTO?.code?.toUpperCase();
    if (code === 'VINFAST') return 'tag-vinfast';
    if (code === 'HYUNDAI') return 'tag-hyundai';
    return 'tag-default';
  }

  formatCurrency(amount?: number): string {
    if (!amount) return '—';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('vi-VN');
  }

  getVehicleStatusClass(status?: string): string {
    switch (status?.toLowerCase()) {
      case 'giữ trong kho': return 'status-active';
      case 'đã bán': return 'status-exported';
      default: return 'status-default';
    }
  }

  get totalVehicles(): number {
    return this.list.reduce((sum, item) => sum + (item.vehicleIds?.length || 0), 0);
  }
}
