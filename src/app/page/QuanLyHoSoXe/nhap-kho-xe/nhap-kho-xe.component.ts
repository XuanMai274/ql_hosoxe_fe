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
import { WarehouseImportDTO } from '../../../models/warehouseImport.model';
import { ExportPNKRequest } from '../../../models/exportPNK-request';
import { DisbursementService } from '../../../service/disbursement.service';
import { DisbursementDTO } from '../../../models/disbursement.model';
import { DisbursementExportRequest } from '../../../models/disbursement-export-request';
import Swal from 'sweetalert2';
import { AuthServiceComponent } from '../../../core/service/auth-service.component';
import { Customer } from '../../../models/customer.model';
import { CustomerService } from '../../../service/customer.service';

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
  vehicleFactor = 0.85;
  realEstateFactor = 0.8;
  selectedCustomer?: Customer;
  //Lưu dữ liệu nhập kho trả về
  warehouseImportResult?: WarehouseImportDTO;
  createdDisbursement?: DisbursementDTO;
  createdLoans: LoanDTO[] = [];
  customers: Customer[] = [];
  //Lưu vehicleIds sau khi backend trả về
  importedVehicleIds: number[] = [];

  //Lưu số phiếu nhập
  importNumber: string = '';
  showNhapKho = false;
  currentStep = 1;
  showPreviewModal = false;
  previewData?: DisbursementDTO;
  // ===== FILTER =====
  chassisNumber = '';
  status = '';
  manufacturer = '';
  ref = '';

  // ===== PAGING =====
  page = 0;
  size = 10;
  totalPages = 0;
  baseRate = 7;
  fundingRate = 5.86;

  constructor(
    private vehicleService: VehicleService,
    private loanService: LoanService,
    private warehouseService: WarehouseService,
    private disbursementService: DisbursementService,
    private router: Router,
    private authService: AuthServiceComponent,
    private customerService: CustomerService,
  ) { }

  ngOnInit(): void {
    this.loadCustomers();
    this.loadVehicles();

  }
  loadCustomers(): void {
    this.customerService.getCustomers().subscribe({
      next: (res) => this.customers = res
    });
  }
  private autoDetectCustomer(): void {

    if (this.selectedVehicles.length === 0) {
      this.selectedCustomer = undefined;
      return;
    }

    const firstCustomerId =
      this.selectedVehicles[0].guaranteeLetterDTO?.customerDTO?.id;

    const sameCustomer = this.selectedVehicles.every(v =>
      v.guaranteeLetterDTO?.customerDTO?.id === firstCustomerId
    );

    if (!sameCustomer) {
      Swal.fire('Lỗi', 'Các xe không cùng một khách hàng', 'error');
      this.selectedVehicles = [];
      this.selectedCustomer = undefined;
      return;
    }

    this.selectedCustomer =
      this.customers.find(c => c.id === firstCustomerId);
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
    return this.loanForms.length > 0;
  }
  previewBatchLoans() {
    if (!this.isBatchValid()) return;
    this.loading = true;
    this.updateVehicleCount();
    // this.recalculateInterest();
    this.disbursementService
      .previewDisbursement()
      .subscribe({
        next: (res) => {
          this.previewData = res;
          this.recalcLimit();
          this.previewData.startDate = new Date();
          this.previewData.loanTerm = 30; // Mặc định 30 ngày
          this.calculatePreviewDueDate();
          this.syncDisbursementAmount();
          this.showPreviewModal = true;
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          Swal.fire('Lỗi', err.error?.message || "Lỗi tải preview", 'error');
        }
      });
  }

  // calculatePreviewDueDate() {
  //   if (!this.previewData || !this.previewData.startDate || !this.previewData.loanTerm) return;
  //   const start = new Date(this.previewData.startDate);
  //   const due = new Date(start);
  //   due.setDate(start.getDate() + Number(this.previewData.loanTerm));
  //   this.previewData.dueDate = due;
  // }

  isNonWorkingDay(date: any): boolean {
    if (!date) return false;
    const d = new Date(date);
    const day = d.getDay();
    const isWeekend = (day === 0 || day === 6); // 0: CN, 6: T7

    // Kiểm tra một số ngày lễ cố định (có thể mở rộng)
    const dateNum = d.getDate();
    const month = d.getMonth() + 1;
    const isHoliday = (dateNum === 1 && month === 1) || // Tết dương
      (dateNum === 30 && month === 4) || // Giải phóng
      (dateNum === 1 && month === 5) ||  // Lao động
      (dateNum === 2 && month === 9);   // Quốc khánh

    return isWeekend || isHoliday;
  }

  getDayOfWeek(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    return days[d.getDay()];
  }

  confirmDisbursement() {
    if (!this.previewData) return;
    this.loading = true;

    const ids = this.getSelectedIds();

    // 1. Gọi API Nhập kho
    this.warehouseService.importWarehouse(ids).subscribe({
      next: (res) => {
        console.log("Warehouse result:", res);
        this.warehouseImportResult = res;
        this.importedVehicleIds = res.vehicleIds;
        this.importNumber = res.importNumber;
        if (this.previewData) {
          this.previewData.mortgageContractId =
            this.warehouseImportResult?.mortgageContractDTO?.id;
        }
        console.log("data giải ngân: ", this.previewData)
        // 2. Gọi API Tạo giải ngân
        this.disbursementService.createDisbursement(this.previewData!).subscribe({
          next: (resDis) => {
            // Lưu giải ngân đã tạo
            this.createdDisbursement = resDis;

            // update lại để dùng cho tạo khoản vay
            this.previewData = resDis;

            // 3. Gọi API Tạo khoản vay
            this.submitBatchLoans();
          },
          error: (err) => {
            this.loading = false;
            Swal.fire('Lỗi', err.error?.message || "Lỗi tạo giải ngân", 'error');
          }
        });
      },
      error: (err) => {
        this.loading = false;
        Swal.fire('Lỗi', err.error?.message || "Lỗi nhập kho", 'error');
      }
    });
  }
  // hàm tính lãi suất
  // recalculateInterest() {

  //   if (!this.previewData) return;

  //   const principal = Number(this.previewData.disbursementAmount) || 0;
  //   const days = Number(this.previewData.loanTerm) || 0;

  //   const rateDiff = (this.baseRate - this.fundingRate) / 100;

  //   const interest =
  //     principal * rateDiff / 365 * days;

  //   this.previewData.interestAmount = Math.round(interest);
  // }
  calculatePreviewDueDate() {
    if (!this.previewData || !this.previewData.startDate || !this.previewData.loanTerm) return;

    const start = new Date(this.previewData.startDate);
    const due = new Date(start);
    due.setDate(start.getDate() + Number(this.previewData.loanTerm));
    this.previewData.dueDate = due;

    // this.recalculateInterest(); // thêm dòng này
  }

  submitBatchLoans() {


    if (!this.selectedCustomer) {
      Swal.fire('Lỗi', 'Không xác định được khách hàng', 'error');
      return;
    }

    const customer = this.selectedCustomer;
    this.buildLoanForms();

    if (!this.isBatchValid()) return;

    this.loading = true;

    const payload: LoanDTO[] = this.loanForms.map(f => ({

      loanContractNumber: this.createdDisbursement?.loanContractNumber,

      loanTerm: this.createdDisbursement?.loanTerm || 0,

      loanDate: this.createdDisbursement?.startDate
        ? this.formatDate(new Date(this.createdDisbursement.startDate))
        : this.formatDate(new Date()),

      dueDate: this.createdDisbursement?.dueDate
        ? this.formatDate(new Date(this.createdDisbursement.dueDate))
        : undefined,

      disbursementDTO: this.createdDisbursement?.id
        ? { id: this.createdDisbursement.id }
        : undefined,

      loanAmount: f.guaranteeAmount,
      withdrawnChassisNumber: f.chassisNumber,

      loanStatus: 'ACTIVE',
      loanType: 'VEHICLE',
      customerDTO: { id: customer.id },

      vehicleDTO: { id: f.vehicleId }

    } as any));

    console.log("Payload tạo khoản vay:", payload);

    this.loanService.createBatchLoans(payload)
      .subscribe({
        next: (resLoans) => {
          this.createdLoans = resLoans;
          this.loading = false;
          this.currentStep = 3;
          this.closePreviewModal();
          // tự động xuất hồ sơ
          this.exportHoSoNhapKhoZip();
          this.exportHoSoGiaiNgan();
          Swal.fire({
            title: 'Thành công!',
            text: 'Đã tạo giải ngân, nhập kho và khoản vay thành công.',
            icon: 'success',
            confirmButtonText: 'Đóng',
            confirmButtonColor: '#028B89'
          });
        },
        error: (err) => {
          this.loading = false;
          console.error("Loan error:", err);
          Swal.fire({
            title: 'Lỗi!',
            text: err.error?.message || 'Có lỗi khi tạo khoản vay',
            icon: 'error',
            confirmButtonText: 'Đóng'
          });
        }
      });
  }

  closePreviewModal() {
    this.previewData = undefined;
    this.showPreviewModal = false;
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
    this.autoDetectCustomer();
    // nếu preview đang mở → auto sync lại
    this.syncDisbursementAmount();
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
  }
  exportHoSoNhapKhoZip() {

    const request: ExportPNKRequest = {
      importNumber: this.importNumber,
      vehicleIds: this.importedVehicleIds
    };

    this.vehicleService.exportHoSoNhapKhoZip(request)
      .subscribe(blob => {
        this.download(blob, `HO_SO_NHAP_KHO_${this.importNumber}.zip`);
      });
  }
  exportPNK() {

    const request: ExportPNKRequest = {
      importNumber: this.importNumber,
      vehicleIds: this.importedVehicleIds
    };

    this.vehicleService.exportPNK(request)
      .subscribe(b =>
        this.download(b, `PNK_${this.importNumber}.docx`)
      );
  }

  exportBaoCao() {

    const request: ExportPNKRequest = {
      importNumber: this.importNumber,
      vehicleIds: this.importedVehicleIds
    };

    this.vehicleService.exportBaoCao(request)
      .subscribe(b =>
        this.download(b, `BAO_CAO_${this.importNumber}.docx`)
      );
  }

  exportBienBan() {

    const request: ExportPNKRequest = {
      importNumber: this.importNumber,
      vehicleIds: this.importedVehicleIds
    };

    this.vehicleService.exportBienBan(request)
      .subscribe(b =>
        this.download(b, `BIEN_BAN_${this.importNumber}.docx`)
      );
  }

  exporPhuLucHopDongThueChap() {

    const request: ExportPNKRequest = {
      importNumber: this.importNumber,
      vehicleIds: this.importedVehicleIds
    };

    this.vehicleService.exporPhuLucHopDongThueChap(request)
      .subscribe(b =>
        this.download(b, `PHU_LUC_${this.importNumber}.docx`)
      );
  }
  exporDangKyGiaoDichDamBao() {
    const request: ExportPNKRequest = {
      importNumber: this.importNumber,
      vehicleIds: this.importedVehicleIds
    };
    this.vehicleService.exporDangKyGiaoDichDamBao(request)
      .subscribe(b =>
        this.download(b, `GIAO_DICH_DAM_BAO_${this.importNumber}.docx`)
      );
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
  exportHoSoGiaiNgan() {

    const request: DisbursementExportRequest = {
      disbursementDTO: this.createdDisbursement,
      vehicleIds: this.importedVehicleIds
    };

    this.vehicleService.exportDisbursementPackage(request)
      .subscribe(b =>
        this.download(b, `HO_SO_GIAI_NGAN_${this.createdDisbursement?.loanContractNumber}.zip`)
      );
  }
  finishNhapKho() {

    const ids = this.getSelectedIds();

    if (ids.length === 0) {
      Swal.fire('Chú ý', "Chưa chọn xe", 'warning');
      return;
    }

    this.loading = true;


  }
  isOverLimit(): boolean {

    if (!this.previewData) return false;

    return (this.previewData.disbursementAmount || 0)
      > (this.previewData.remainingLimit || 0);
  }
  recalcLimit() {

    if (!this.previewData) return;

    const guarantee = Number(this.previewData.issuedGuaranteeBalance) || 0;
    const vehicleLoan = Number(this.previewData.vehicleLoanBalance) || 0;
    const realEstateLoan = Number(this.previewData.realEstateLoanBalance) || 0;

    // Tổng đã sử dụng
    const used = guarantee + vehicleLoan + realEstateLoan;

    this.previewData.usedLimit = used;

    // Hạn mức còn lại = hạn mức tổng - đã sử dụng
    const creditLimit = Number(this.previewData.creditLimit) || 0;

    this.previewData.remainingLimit = creditLimit - used;
  }
  recalculateValues() {

    if (!this.previewData) return;

    const vehicleValue = Number(this.previewData.totalCollateralValue) || 0;
    const realEstateValue = Number(this.previewData.realEstateValue) || 0;

    const vehicleFactor = Number(this.vehicleFactor) || 0;
    const realEstateFactor = Number(this.realEstateFactor) || 0;

    this.previewData.collateralValueAfterFactor =
      vehicleValue * vehicleFactor;

    this.previewData.realEstateValueAfterFactor =
      realEstateValue * realEstateFactor;
  }
  private syncDisbursementAmount() {
    if (!this.previewData) return;

    this.previewData.disbursementAmount = this.getTotalLoanAmount();

    //this.recalculateInterest(); // thêm dòng này
    this.updateVehicleCount();
  }
  updateVehicleCount() {
    if (!this.previewData) return;

    this.previewData.totalVehiclesCount =
      this.selectedVehicles.length;
  }
  formatMoney(value: number | null | undefined): string {
    if (!value && value !== 0) return '';
    return value.toLocaleString('vi-VN');
  }

  parseMoney(value: string): number {
    return Number(value.replace(/\./g, '').replace(/,/g, ''));
  }
  onMoneyInput(event: any, field: keyof DisbursementDTO) {

    if (!this.previewData) return;

    const rawValue = event.target.value;
    const numericValue = this.parseMoney(rawValue);

    this.previewData![field] = numericValue as any;

    event.target.value = this.formatMoney(numericValue);
  }
  doneNhapKho(): void {

    Swal.fire({
      title: 'Hoàn tất?',
      text: 'Hoàn tất quá trình nhập kho?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Xác nhận',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#028B89'
    }).then(result => {

      if (!result.isConfirmed) return;

      // Reset toàn bộ state
      this.resetAllState();

      // Reload danh sách xe
      this.loadVehicles();

      Swal.fire({
        title: 'Thành công',
        text: 'Đã hoàn tất và làm mới dữ liệu.',
        icon: 'success',
        confirmButtonColor: '#028B89'
      });

    });
  }
  private resetAllState(): void {

    // Step
    this.currentStep = 1;

    // Selection
    this.selectedVehicles = [];
    this.loanForms = [];
    this.selectedCustomer = undefined;

    // Preview
    this.previewData = undefined;
    this.showPreviewModal = false;

    // Import / Disbursement
    this.warehouseImportResult = undefined;
    this.createdDisbursement = undefined;
    this.createdLoans = [];
    this.importedVehicleIds = [];
    this.importNumber = '';

    // Reset filter
    this.chassisNumber = '';
    this.status = '';
    this.manufacturer = '';
    this.ref = '';

    // Reset paging
    this.page = 0;
  }

}
