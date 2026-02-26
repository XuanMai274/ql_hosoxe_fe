import { Component } from '@angular/core';
import { VehicleList } from '../../../models/vehiclelist.model';
import { VehicleService } from '../../../service/vehicle.service';
import { Router } from '@angular/router';
import { PageResponse } from '../../../models/page-response';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Vehicle } from '../../../models/vehicle';
import { VehicleLoanForm } from '../../../models/vehicle_loan_form.model';
import { LoanService } from '../../../service/loan.service';
import { LoanDTO } from '../../../models/loan.model';
import { WarehouseService } from '../../../service/warehouse.service';

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
  today = new Date();
  loading = false;
  selectedVehicles: Vehicle[] = [];
  loanForms: VehicleLoanForm[] = [];

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
    private loanService: LoanService,
     private warehouseService: WarehouseService,
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
  calculateDueDate(vehicle: any) {
    if (!vehicle.loanTerm || vehicle.loanTerm <= 0) return;

    const loanDate = new Date(this.today);
    const due = new Date(loanDate);

    due.setDate(loanDate.getDate() + Number(vehicle.loanTerm));

    vehicle.loanDate = loanDate;
    vehicle.dueDate = due;
  }
  private buildLoanForms() {
    this.loanForms = this.selectedVehicles.map(v => ({
      vehicleId: v.id!,
      vihicleName: v.assetName || '',
      chassisNumber: v.chassisNumber!,
      vehicleName: v.vehicleName!,
      guaranteeLetterId: v.guaranteeLetterDTO?.id,
      guaranteeAmount: v.guaranteeAmount || 0
    }));
  }
  getTotalLoanAmount() {
    return this.selectedVehicles.reduce(
      (sum, v) => sum + (v.guaranteeAmount || 0),
      0
    );
  }
  isBatchValid(): boolean {
    return this.loanForms.length > 0 &&
      this.loanForms.every(f =>
        // f.loanContractNumber &&
        f.loanTerm &&
        f.loanTerm > 0
      );
  }
  submitBatchLoans() {

    if (!this.isBatchValid()) return;

    this.loading = true;

    const payload: LoanDTO[] = this.loanForms.map(f => ({

      // loanContractNumber: f.loanContractNumber!,
      loanTerm: f.loanTerm!,

      // 👇 convert Date sang string yyyy-MM-dd
      loanDate: this.formatDate(this.today),
      dueDate: f.dueDate ? this.formatDate(f.dueDate) : undefined,

      loanAmount: f.guaranteeAmount,
      withdrawnChassisNumber: f.chassisNumber,

      loanStatus: 'ACTIVE',
      loanType: 'VEHICLE',

      customerDTO: { id: 2 },
      vehicleId: f.vehicleId

    }));

    this.loanService.createBatchLoans(payload)
      .subscribe({
        next: () => {
          this.loading = false;
          this.currentStep = 3;
        },
        error: () => {
          this.loading = false;
          alert('Có lỗi xảy ra');
        }
      });
  }
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
  openNhapKho() {
    this.currentStep = 2;
  }
  //// ===== STEP =====
  goToStep(step: number) {
    this.currentStep = step;
  }

  nextStep() {
    if (this.currentStep === 1) {
      this.buildLoanForms();
    }
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
        v.manufacturerDTO?.code === this.manufacturer;
      console.log("selected:", this.manufacturer);
      console.log("vehicle code:", v.guaranteeLetterDTO?.manufacturerDTO?.code);
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

  exporPhuLucHopDongThueChap() {
    this.vehicleService.exporPhuLucHopDongThueChap(this.getSelectedIds())
      .subscribe(b => this.download(b, 'PHU_LUC_HOP_DONG_THUE_CHAP.docx'));
  }
  exporDangKyGiaoDichDamBao() {
    this.vehicleService.exporDangKyGiaoDichDamBao(this.getSelectedIds())
      .subscribe(b => this.download(b, 'DANG_KY_GIAO_DICH_DAM_BAO.docx'));
  }

  // exportVinfast() {
  //   this.vehicleService.exportVinfast(this.getSelectedIds())
  //     .subscribe(b => this.download(b, 'PHU_LUC_VINFAST.docx'));
  // }
  exportAll() {

    this.exportPNK();
    this.exportBaoCao();
    this.exportBienBan();
    this.exporPhuLucHopDongThueChap();
    this.exporDangKyGiaoDichDamBao();
    // this.exportVinfast();
  }
  finishNhapKho() {

  const ids = this.getSelectedIds();

  if (ids.length === 0) {
    alert("Chưa chọn xe");
    return;
  }

  this.loading = true;

  this.warehouseService.importWarehouse(ids)
    .subscribe({
      next: (res) => {

        console.log("Import result:", res);

        this.loading = false;
        alert("Nhập kho thành công");

        // reset
        this.showNhapKho = false;
        this.selectedVehicles = [];
        this.currentStep = 1;

        this.loadVehicles(); // reload lại danh sách
      },
      error: (err) => {
        this.loading = false;
        alert(err.error?.message || "Có lỗi xảy ra khi nhập kho");
      }
    });
}
}
