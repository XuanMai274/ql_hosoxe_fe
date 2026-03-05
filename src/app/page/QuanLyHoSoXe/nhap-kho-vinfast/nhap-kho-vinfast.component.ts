import { Component } from '@angular/core';
import { Vehicle } from '../../../models/vehicle';
import { VehicleService } from '../../../service/vehicle.service';
import { PageResponse } from '../../../models/page-response';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { Customer } from '../../../models/customer.model';
import { ExportPNKRequest } from '../../../models/exportPNK-request';
import { WarehouseService } from '../../../service/warehouse.service';
@Component({
  selector: 'app-nhap-kho-vinfast',
  imports: [FormsModule, CommonModule],
  templateUrl: './nhap-kho-vinfast.component.html',
  styleUrl: './nhap-kho-vinfast.component.css'
})
export class NhapKhoVinfastComponent {

  vehiclesAll: Vehicle[] = [];
  filteredVehicles: Vehicle[] = [];
  vehicles: Vehicle[] = [];

  currentStep = 1;
  selectedVehicles: Vehicle[] = [];

  chassisNumber = '';
  ref = '';
  deadlineStatus = '';

  page = 0;
  size = 10;
  totalPages = 1;

  loading = false;

  constructor(private vehicleService: VehicleService, private warehouseService: WarehouseService) { }

  ngOnInit(): void {
    this.loadVehicles();
  }

  loadVehicles(): void {
    this.vehicleService.getVinfastInSafeVehicles().subscribe({
      next: (res: Vehicle[]) => {
        this.vehiclesAll = res;
        this.filteredVehicles = [...res];
        this.updatePage();
      },
      error: () => {
        Swal.fire('Lỗi', 'Không tải được danh sách xe', 'error');
      }
    });
  }

  search(): void {

    const chassis = this.chassisNumber.toLowerCase().trim();
    const ref = this.ref.toLowerCase().trim();
    const deadline = this.deadlineStatus;

    this.filteredVehicles = this.vehiclesAll.filter(v => {

      const matchChassis =
        !chassis ||
        this.fuzzyMatch(v.chassisNumber || '', chassis);

      const matchRef =
        !ref ||
        (v.guaranteeLetterDTO?.referenceCode || '')
          .toLowerCase()
          .includes(ref);

      const matchDeadline =
        !deadline ||
        this.matchDeadlineStatus(v, deadline);

      return matchChassis && matchRef && matchDeadline;
    });

    this.page = 0;
    this.updatePage();
  }
  private fuzzyMatch(source: string, keyword: string): boolean {

    if (!source || !keyword) return false;

    source = source.toLowerCase();
    keyword = keyword.toLowerCase();

    let i = 0; // index source
    let j = 0; // index keyword

    while (i < source.length && j < keyword.length) {
      if (source[i] === keyword[j]) {
        j++;
      }
      i++;
    }

    return j === keyword.length;
  }
  clearFilter(): void {
    this.chassisNumber = '';
    this.ref = '';
    this.deadlineStatus = '';
    this.filteredVehicles = [...this.vehiclesAll];
    this.page = 0;
    this.updatePage();
  }

  private matchDeadlineStatus(vehicle: Vehicle, status: string): boolean {

    const label = (vehicle.deadlineLabel || '').toLowerCase();

    if (status === 'OVERDUE')
      return label.includes('quá hạn');

    if (status === 'TODAY')
      return label.includes('hôm nay');

    if (status === 'WARNING')
      return label.includes('còn');

    return true;
  }

  updatePage(): void {

    const total = this.filteredVehicles.length;

    this.totalPages = Math.max(1, Math.ceil(total / this.size));

    if (this.page >= this.totalPages) {
      this.page = this.totalPages - 1;
    }

    const start = this.page * this.size;
    const end = start + this.size;

    this.vehicles = this.filteredVehicles.slice(start, end);
  }

  changePage(p: number): void {
    if (p < 0 || p >= this.totalPages) return;
    this.page = p;
    this.updatePage();
  }

  trackByVehicle(index: number, item: Vehicle) {
    return item.id;
  }

  onSelectVehicle(vehicle: Vehicle, event: Event) {

    const checked = (event.target as HTMLInputElement).checked;

    if (checked) {
      if (!this.selectedVehicles.some(v => v.id === vehicle.id)) {
        this.selectedVehicles.push(vehicle);
      }
    } else {
      this.selectedVehicles =
        this.selectedVehicles.filter(v => v.id !== vehicle.id);
    }
  }

  isSelected(vehicle: Vehicle): boolean {
    return this.selectedVehicles.some(v => v.id === vehicle.id);
  }

  isAllCurrentPageSelected(): boolean {
    return this.vehicles.length > 0 &&
      this.vehicles.every(v =>
        this.selectedVehicles.some(s => s.id === v.id)
      );
  }

  toggleSelectAll(event: Event): void {

    const checked = (event.target as HTMLInputElement).checked;

    if (checked) {
      this.vehicles.forEach(v => {
        if (!this.selectedVehicles.some(s => s.id === v.id)) {
          this.selectedVehicles.push(v);
        }
      });
    } else {
      this.selectedVehicles =
        this.selectedVehicles.filter(
          s => !this.vehicles.some(v => v.id === s.id)
        );
    }
  }

  goToStep(step: number) {
    this.currentStep = step;
  }

  nextStep() {
    this.currentStep++;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  prevStep() {
    this.currentStep--;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  clearSelection(): void {
    this.selectedVehicles = [];
  }
  getDeadlineClass(label?: string): string {

    if (!label) return '';

    const l = label.toLowerCase();

    if (l.includes('quá hạn')) return 'deadline-overdue';
    if (l.includes('hôm nay')) return 'deadline-today';
    if (l.includes('còn')) return 'deadline-warning';

    return '';
  }

  confirmNhapKho(): void {

    if (this.selectedVehicles.length === 0) {
      Swal.fire('Thông báo', 'Vui lòng chọn xe trước khi nhập kho', 'warning');
      return;
    }

    const ids = this.selectedVehicles.map(v => v.id!);

    Swal.fire({
      title: 'Xác nhận nhập kho?',
      text: `Đã chọn ${ids.length} xe.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Xác nhận'
    }).then(result => {

      if (result.isConfirmed) {

        this.vehicleService.updateVehicleInSafe(ids, false).subscribe({
          next: () => {
            this.currentStep = 3;
            this.autoDownloadFiles();
            Swal.fire('Thành công', 'Đang tải bộ hồ sơ ZIP', 'success');
          },
          error: () => {
            Swal.fire('Lỗi', 'Có lỗi xảy ra khi cập nhật trạng thái xe', 'error');
          }
        });

      }
    });
  }
  private groupByImportId(vehicles: Vehicle[]): Map<number, Vehicle[]> {

    const map = new Map<number, Vehicle[]>();

    vehicles.forEach(v => {

      const importId = v.warehouseImportId; // hoặc v.warehouseImportDTO?.id

      if (!importId) return;

      if (!map.has(importId)) {
        map.set(importId, []);
      }

      map.get(importId)!.push(v);
    });

    return map;
  }
  private autoDownloadFiles(): void {

    const grouped = this.groupByImportId(this.selectedVehicles);

    grouped.forEach((vehicles, importId) => {

      const ids = vehicles.map(v => v.id!);

      // Bước 1: Lấy số hợp đồng thật
      this.warehouseService.getWarehouseImportById(importId)
        .subscribe(importRes => {

          const importNumber = importRes.importNumber;

          const request: ExportPNKRequest = {
            importNumber: importNumber,
            code: '',
            vehicleIds: ids
          };

          // Bước 2: Gọi export
          this.vehicleService
            .exportHoSoNhapKhoVinfastZip(request)
            .subscribe(blob => {

              this.downloadFile(
                blob,
                `${importNumber}_NHAP_KHO_VINFAST_.zip`
              );

            });

        });

    });
  }

  private downloadFile(blob: Blob, filename: string): void {

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
