import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomerWarehouseService } from '../../../service/customer-warehouse.service';
import { WarehouseImportDTO } from '../../../models/warehouseImport.model';
import { Vehicle } from '../../../models/vehicle';
import { ExportPNKRequest } from '../../../models/exportPNK-request';

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
  exporting = false;
  // Phân trang
  page = 0;
  size = 10;
  totalPages = 0;
  totalElements = 0;
  totalVehicles = 0;


  // Modal chi tiết
  showDetail = false;
  selectedItem: WarehouseImportDTO | null = null;
  loadingDetail = false;

  constructor(private service: CustomerWarehouseService) { }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(page: number = 0): void {
    this.page = page;
    this.loading = true;
    this.error = '';
    this.service.getMyWarehouseImports(this.page, this.size).subscribe({
      next: (res) => {
        this.list = res.content;
        this.totalPages = res.totalPages;
        this.totalElements = res.totalElements;
        this.totalVehicles = this.list.reduce((sum, item) => sum + (item.vehicleCount || item.vehicleIds?.length || 0), 0);
        this.loading = false;
      },
      error: (err) => {
        console.error('Lỗi load nhập kho:', err);
        this.error = 'Không thể tải dữ liệu. Vui lòng thử lại.';
        this.loading = false;
      }
    });
  }
  exportHoSoXuatKho(item?: WarehouseImportDTO): void {
    const target = item || this.selectedItem;
    if (!target) return;

    const vehicleIds = (target.vehicleIds || [])
      .filter((id): id is number => id !== undefined);

    if (vehicleIds.length === 0) {
      alert('Không có phương tiện để xuất.');
      return;
    }

    const request: ExportPNKRequest = {
      importNumber: target.importNumber!,
      vehicleIds: vehicleIds
    };

    this.exporting = true;

    this.service.exportCustomerExportZip(request)
      .subscribe({
        next: (blob: Blob) => {

          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${request.importNumber}.zip`;
          link.click();
          window.URL.revokeObjectURL(url);

          this.exporting = false;
        },
        error: () => {
          alert('Xuất hồ sơ thất bại.');
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

  openDetail(item: WarehouseImportDTO): void {
    this.selectedItem = item;
    this.showDetail = true;
    document.body.style.overflow = 'hidden';
    // Danh sách xe đã được load sẵn từ API danh sách nhờ JOIN FETCH
    this.loadingDetail = false;
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

}
