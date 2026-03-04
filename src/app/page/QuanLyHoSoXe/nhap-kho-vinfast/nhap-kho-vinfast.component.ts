import { Component } from '@angular/core';
import { Vehicle } from '../../../models/vehicle';
import { VehicleService } from '../../../service/vehicle.service';
import { PageResponse } from '../../../models/page-response';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { Customer } from '../../../models/customer.model';
import { ExportPNKRequest } from '../../../models/exportPNK-request';
@Component({
  selector: 'app-nhap-kho-vinfast',
  imports: [FormsModule, CommonModule],
  templateUrl: './nhap-kho-vinfast.component.html',
  styleUrl: './nhap-kho-vinfast.component.css'
})
export class NhapKhoVinfastComponent {
  // ===============================
  // DATA SOURCE
  // ===============================
  vehiclesAll: Vehicle[] = [];
  filteredVehicles: Vehicle[] = [];
  vehicles: Vehicle[] = [];
  currentStep = 1;
  selectedVehicles: Vehicle[] = [];
  selectedCustomer?: Customer;

  importNumber = '';
  code = '';

  loading = false;

  // ===============================
  // FILTER
  // ===============================
  chassisNumber = '';
  ref = '';
  manufacturer = '';
  status = '';

  // ===============================
  // PAGINATION
  // ===============================
  page = 0;
  size = 10;
  totalPages = 1;

  constructor(private vehicleService: VehicleService) { }

  ngOnInit(): void {
    this.loadVehicles();
  }

  // ===============================
  // LOAD DATA
  // ===============================
  loadVehicles(): void {
    this.loading = true;
    this.vehicleService.getVinfastInSafeVehicles().subscribe({
      next: (res: Vehicle[]) => {
        this.vehiclesAll = res;
        this.filteredVehicles = [...res];
        this.updatePage();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        Swal.fire('Lỗi', 'Không tải được danh sách xe', 'error');
      }
    });
  }

  // ===============================
  // FILTER
  // ===============================
  search(): void {

    const chassis = this.chassisNumber?.toLowerCase().trim() || '';
    const ref = this.ref?.toLowerCase().trim() || '';
    const manu = this.manufacturer?.trim() || '';
    const status = this.status?.trim() || '';

    this.filteredVehicles = this.vehiclesAll.filter(v => {

      const matchChassis =
        !chassis ||
        (v.chassisNumber || '').toLowerCase().includes(chassis);

      const matchGuarantee =
        !ref ||
        (v.guaranteeLetterDTO?.referenceCode || '')
          .toLowerCase()
          .includes(ref);

      const matchManufacturer =
        !manu ||
        v.manufacturerDTO?.code === manu;

      const matchStatus =
        !status ||
        v.status === status;

      const matchDeadline =
        this.matchDeadlineStatus(v);

      return matchChassis &&
        matchGuarantee &&
        matchManufacturer &&
        matchStatus &&
        matchDeadline;
    });

    this.page = 0;
    this.updatePage();
  }

  clearFilter(): void {
    this.chassisNumber = '';
    this.ref = '';
    this.manufacturer = '';
    this.status = '';

    this.filteredVehicles = [...this.vehiclesAll];
    this.page = 0;
    this.updatePage();
  }

  private matchDeadlineStatus(vehicle: Vehicle): boolean {

    if (!this.status) return true;

    const label = (vehicle.deadlineLabel || '').toLowerCase();

    if (this.status === 'OVERDUE')
      return label.includes('quá hạn');

    if (this.status === 'TODAY')
      return label.includes('hôm nay');

    if (this.status === 'WARNING')
      return label.includes('còn');

    return true;
  }

  // ===============================
  // PAGINATION
  // ===============================
  updatePage(): void {

    const total = this.filteredVehicles.length;

    this.totalPages = Math.max(
      1,
      Math.ceil(total / this.size)
    );

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

  // ===============================
  // SELECTION
  // ===============================
  onSelectVehicle(vehicle: Vehicle, event: Event) {

    const input = event.target as HTMLInputElement;

    if (input.checked) {

      if (!this.selectedVehicles.find(v => v.id === vehicle.id)) {
        this.selectedVehicles.push(vehicle);
      }

    } else {

      this.selectedVehicles =
        this.selectedVehicles.filter(v => v.id !== vehicle.id);
    }

    this.autoDetectCustomer();
  }

  selectAllCurrentPage(): void {

    this.vehicles.forEach(v => {

      if (!this.selectedVehicles.find(s => s.id === v.id)) {
        this.selectedVehicles.push(v);
      }

    });

    this.autoDetectCustomer();
  }

  clearSelection(): void {
    this.selectedVehicles = [];
    this.selectedCustomer = undefined;
  }

  isChecked(vehicle: Vehicle): boolean {
    return !!this.selectedVehicles.find(v => v.id === vehicle.id);
  }

  private autoDetectCustomer(): void {

    if (!this.selectedVehicles.length) {
      this.selectedCustomer = undefined;
      return;
    }

    const customer = this.selectedVehicles[0].guaranteeLetterDTO?.customerDTO;

    const sameCustomer = this.selectedVehicles.every(v =>
      v.guaranteeLetterDTO?.customerDTO?.id === customer?.id
    );

    this.selectedCustomer = sameCustomer ? customer : undefined;
  }

  // ===============================
  // HELPER
  // ===============================

  getDeadlineClass(label?: string): string {

    if (!label) return '';

    const l = label.toLowerCase();

    if (l.includes('quá hạn')) return 'deadline-overdue';
    if (l.includes('hôm nay')) return 'deadline-today';
    if (l.includes('còn')) return 'deadline-warning';

    return '';
  }
  //// ===== STEP =====
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
  // kiểm tra xem xe đã được chọn chưa
  isSelected(vehicle: Vehicle): boolean {
    return this.selectedVehicles.some(v => v.id === vehicle.id);
  }

  confirmNhapKho(): void {
    if (this.selectedVehicles.length === 0) {
      Swal.fire('Thông báo', 'Vui lòng chọn xe trước khi nhập kho', 'warning');
      return;
    }

    const ids = this.selectedVehicles.map(v => v.id!).filter(id => !!id);

    Swal.fire({
      title: 'Xác nhận nhập kho?',
      text: `Đã chọn ${ids.length} xe để cập nhật trạng thái và xuất hồ sơ.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Xác nhận',
      cancelButtonText: 'Hủy'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        // Gọi API cập nhật inSafe = false trước khi xuất
        this.vehicleService.updateVehicleInSafe(ids, false).subscribe({
          next: () => {
            this.loading = false;
            this.currentStep = 3;
            this.autoDownloadFiles(ids);
            Swal.fire('Thành công', 'Đã cập nhật trạng thái và đang tải bộ hồ sơ ZIP', 'success');
          },
          error: (err) => {
            this.loading = false;
            Swal.fire('Lỗi', err.error?.message || 'Có lỗi xảy ra khi cập nhật trạng thái xe', 'error');
          }
        });
      }
    });
  }

  private autoDownloadFiles(ids: number[]): void {
    const request: ExportPNKRequest = {
      importNumber: this.importNumber,
      code: this.code,
      vehicleIds: ids
    };

    // Xuất toàn bộ hồ sơ dạng file ZIP
    this.vehicleService.exportHoSoNhapKhoZip(request).subscribe(blob => {
      this.downloadFile(blob, `BO_HO_SO_NHAP_KHO_VINFAST_${this.importNumber || new Date().getTime()}.zip`);
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
