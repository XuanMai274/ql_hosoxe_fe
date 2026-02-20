import { Component } from '@angular/core';
import { VehicleList } from '../../../models/vehiclelist.model';
import { VehicleService } from '../../../service/vehicle.service';
import { Router } from '@angular/router';
import { PageResponse } from '../../../models/page-response';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Vehicle } from '../../../models/vehicle';

@Component({
  selector: 'app-nhap-kho-xe',
  imports: [ReactiveFormsModule, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './nhap-kho-xe.component.html',
  styleUrl: './nhap-kho-xe.component.css'
})
export class NhapKhoXeComponent {
  vehicles: Vehicle[] = [];
  vehiclesAll: Vehicle[] = [];
  filteredVehicles: Vehicle[] = [];

  loading = false;
  selectedVehicles: Vehicle[] = [];
  showNhapKho = false;
  currentStep = 1;
  // ===== FILTER =====
  chassisNumber = '';
  status = '';
  manufacturer = '';
  ref = '';

  // ===== PAGING =====
  page = 0;
  size = 10;
  totalPages = 0;


  constructor(
    private vehicleService: VehicleService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadVehicles();
  }

  // ===== LOAD DATA =====
  loadVehicles(): void {

    this.loading = true;

    this.vehicleService.getVehicleByStatus('Giữ két').subscribe({
      next: (res: Vehicle[]) => {

        this.vehiclesAll = res;
        this.filteredVehicles = [...res];

        this.updatePage();
        this.loading = false;
      }
    });
  }
  openNhapKho() {
    this.currentStep = 2;
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
  // ===== SEARCH =====
  search(): void {

    this.filteredVehicles = this.vehiclesAll.filter(v => {

      // filter chassis
      const matchChassis =
        !this.chassisNumber ||
        v.chassisNumber?.toLowerCase()
          .includes(this.chassisNumber.toLowerCase());

      // filter guarantee
      const matchGuarantee =
        !this.ref ||
        v.guaranteeLetterDTO?.referenceCode
          ?.toLowerCase()
          .includes(this.ref.toLowerCase());

      // filter manufacturer
      const matchManufacturer =
        !this.manufacturer ||
        v.guaranteeLetterDTO?.manufacturerDTO?.code === this.manufacturer;

      // filter deadline label
      const matchDeadline = this.matchDeadlineStatus(v);

      return matchChassis && matchGuarantee && matchManufacturer && matchDeadline;
    });

    this.page = 0;
    this.updatePage();
  }

  // ===== PAGINATION =====
  updatePage(): void {

    const start = this.page * this.size;
    const end = start + this.size;

    this.vehicles = this.filteredVehicles.slice(start, end);

    this.totalPages = Math.ceil(this.filteredVehicles.length / this.size);
  }

  changePage(p: number): void {

    if (p < 0 || p >= this.totalPages) return;

    this.page = p;
    this.updatePage();
  }

  // ===== DEADLINE FILTER =====
  matchDeadlineStatus(vehicle: Vehicle): boolean {

    if (!this.status) return true;

    const label = vehicle.deadlineLabel || '';

    switch (this.status) {

      case 'Giữ két':
        return label.includes('Còn');

      case 'Giữ trong kho':
        return label.includes('hôm nay');

      case 'Đã trả khách hàng':
        return label.includes('quá hạn');

      default:
        return true;
    }
  }

  // ===== DEADLINE CSS =====
  getDeadlineClass(label: string): string {

    if (!label) return '';

    if (label.includes('quá hạn')) return 'deadline-overdue';
    if (label.includes('hôm nay')) return 'deadline-today';

    return 'deadline-warning';
  }

  // ===== CHECKBOX =====
  onSelectVehicle(vehicle: Vehicle, event: Event) {

    const input = event.target as HTMLInputElement;

    if (input.checked) {
      this.selectedVehicles.push(vehicle);
    } else {
      this.selectedVehicles =
        this.selectedVehicles.filter(v => v.id !== vehicle.id);
    }
  }
  // ===== DETAIL =====
  viewDetail(id: number): void {

    this.router.navigate(['manager/vehicles/detail', id], {
      queryParams: {
        chassisNumber: this.chassisNumber || null,
        status: this.status || null,
        manufacturer: this.manufacturer || null,
        ref: this.ref || null,
        page: this.page
      }
    });
  }

  // ===== EXPORT =====
  exportExcel(): void {

    this.vehicleService.exportExcel({
      chassisNumber: this.chassisNumber || undefined,
      status: this.status || undefined,
      manufacturer: this.manufacturer || undefined,
      ref: this.ref || undefined
    }).subscribe(blob => {

      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = 'danh_sach_xe.xlsx';
      a.click();

      window.URL.revokeObjectURL(url);
    });
  }
  // nhập kho xe xong đóng modal
  private getSelectedIds(): number[] {
    return this.selectedVehicles.map(v => v.id).filter((id): id is number => id !== undefined);
  }
  private download(blob: Blob, fileName: string) {
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();

    window.URL.revokeObjectURL(url);
  } exportPNK() {
    this.vehicleService.exportPNK(this.getSelectedIds())
      .subscribe(b => this.download(b, 'PNK.docx'));
  }

  exportBaoCao() {
    this.vehicleService.exportBaoCao(this.getSelectedIds())
      .subscribe(b => this.download(b, 'BAO_CAO_DINH_GIA.docx'));
  }

  exportBienBan() {
    this.vehicleService.exportBienBan(this.getSelectedIds())
      .subscribe(b => this.download(b, 'BIEN_BAN_DINH_GIA.docx'));
  }

  exportHyundai() {
    this.vehicleService.exportHyundai(this.getSelectedIds())
      .subscribe(b => this.download(b, 'PHU_LUC_HYUNDAI.docx'));
  }

  exportVinfast() {
    this.vehicleService.exportVinfast(this.getSelectedIds())
      .subscribe(b => this.download(b, 'PHU_LUC_VINFAST.docx'));
  }
  exportAll() {

    this.exportPNK();
    this.exportBaoCao();
    this.exportBienBan();
    this.exportHyundai();
    this.exportVinfast();
  }
  finishNhapKho() {
    this.showNhapKho = false;
    this.selectedVehicles = [];
    this.currentStep = 3;
  }
}
