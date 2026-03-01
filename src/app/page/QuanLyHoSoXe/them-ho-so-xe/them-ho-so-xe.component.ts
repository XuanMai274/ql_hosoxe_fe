import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Vehicle } from '../../../models/vehicle';
import { Invoice } from '../../../models/invoice-data.model';
import { InvoiceService } from '../../../service/invoice.service';
import { Guarantee } from '../../../models/guarantee.model';
import { VehicleService } from '../../../service/vehicle.service';
import { Manufacturer } from '../../../models/manufacturer';
import { GuaranteeService } from '../../../service/guarantee.service';
import { ManufacturerService } from '../../../service/manufacturer.service';
import { GuaranteeLetter } from '../../../models/guarantee_letter';
import { GuaranteeLetterService } from '../../../service/guarantee-letter.service';
import { FormsModule } from '@angular/forms';
import { VehicleInvoiceService } from '../../../service/vehicle-invoice.service';
import { DocumentService } from '../../../service/document.service';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-them-ho-so-xe',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './them-ho-so-xe.component.html',
  styleUrl: './them-ho-so-xe.component.css'
})
export class ThemHoSoXeComponent {
  vehicleFiles: { [index: number]: File[] } = {};
  createdVehicles: Vehicle[] = [];
  /* ================= STEP ================= */
  currentStep: 1 | 2 = 1;

  /* ================= TAB ================= */
  activeTab: 'manual' | 'upload' | null = null;

  /* ================= BRAND ================= */
  brands: Manufacturer[] = [];
  selectedBrand: Manufacturer | null = null;

  /* ================= GUARANTEE ================= */
  guaranteeList: any[] = [];
  selectedGuarantee: any | null = null;

  /* ================= UPLOAD ================= */
  files: File[] = [];

  /* ================= FORM ================= */
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private manufacturerService: ManufacturerService,
    private guaranteeService: GuaranteeLetterService,
    private vehicleInvoiceService: VehicleInvoiceService,
    private documentService: DocumentService
  ) {
    const now = new Date();
    const yLocal = now.getFullYear();
    const mLocal = (now.getMonth() + 1).toString().padStart(2, '0');
    const dLocal = now.getDate().toString().padStart(2, '0');

    this.form = this.fb.group({
      guaranteeId: [''],
      invoiceNumber: ['', Validators.required],
      invoiceDate: [`${yLocal}-${mLocal}-${dLocal}`, Validators.required],
      totalAmount: [0, [Validators.required, Validators.min(0)]],
      vehicles: this.fb.array([])
    });
  }

  /* ================= INIT ================= */
  ngOnInit(): void {
    this.loadBrands();
  }

  loadBrands(): void {
    this.manufacturerService.getManufacture().subscribe({
      next: res => this.brands = res,
      error: () => this.brands = []
    });
  }

  /* ================= BRAND ================= */
  selectBrand(brand: Manufacturer): void {
    this.selectedBrand = brand;
  }

  goToUpload(): void {
    if (!this.selectedBrand) return;
    this.currentStep = 2;
    this.activeTab = null;
    this.loadGuaranteeList(); // Load danh sách thư bảo lãnh khi chuyển sang step 2
  }

  backToBrand(): void {
    this.currentStep = 1;
    this.activeTab = null;
    this.selectedBrand = null;

    this.resetGuarantee();
    this.resetForm();
  }

  /* ================= TAB ================= */
  setTab(tab: 'upload' | 'manual'): void {
    this.activeTab = tab;

    if (tab === 'upload') {
      this.vehicles.clear();
    }
  }

  /* ================= GUARANTEE DROPDOWN ================= */

  loadGuaranteeList(): void {
    if (!this.selectedBrand) return;

    const brandCode = this.selectedBrand?.code;
    if (!brandCode) {
      console.warn('Brand code is missing');
      return;
    }

    // Gọi API để lấy toàn bộ danh sách thư bảo lãnh theo hãng xe
    this.guaranteeService
      .suggest('', brandCode) // Truyền keyword rỗng để lấy tất cả
      .subscribe({
        next: res => this.guaranteeList = res || [],
        error: () => this.guaranteeList = []
      });
  }

  onGuaranteeChange(): void {
    const selectedId = this.form.get('guaranteeId')?.value;

    if (!selectedId) {
      this.selectedGuarantee = null;
      return;
    }

    // Tìm thư bảo lãnh được chọn từ danh sách
    this.selectedGuarantee = this.guaranteeList.find(g => g.id === Number(selectedId)) || null;
  }

  clearGuarantee(): void {
    this.resetGuarantee();
  }

  resetGuarantee(): void {
    this.guaranteeList = [];
    this.selectedGuarantee = null;
    this.form.get('guaranteeId')?.setValue('');
  }

  /* ================= VEHICLE FORM ================= */
  get vehicles(): FormArray {
    return this.form.get('vehicles') as FormArray;
  }

  createVehicleForm(): FormGroup {
    return this.fb.group({
      vehicleName: ['', Validators.required],
      chassisNumber: ['', Validators.required],
      engineNumber: ['', Validators.required],
      modelType: [''],
      color: ['', Validators.required],
      seats: [5, Validators.min(2)],
      price: [0, Validators.min(0)],
      importDate: [''],
      status: ['Giữ két']
    });
  }

  addVehicle(): void {
    if (!this.selectedGuarantee) {
      alert('Vui lòng chọn thư bảo lãnh trước');
      return;
    }

    this.vehicles.push(this.createVehicleForm());
  }

  removeVehicle(index: number): void {
    this.vehicles.removeAt(index);
  }

  /* ================= UPLOAD ================= */
  onVehicleFileChange(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.vehicleFiles[index] = Array.from(input.files);
    }
  }

  /* ================= VALIDATION ================= */
  isTotalVehicleAmountExceeded(): boolean {
    if (!this.selectedGuarantee) return false;

    const total = this.vehicles.controls.reduce((sum, v) => {
      return sum + Number(v.get('price')?.value || 0);
    }, 0);

    return total > Number(this.selectedGuarantee.remainingAmount || 0);
  }

  /* ================= SUBMIT ================= */
  submit(): void {
    if (this.form.invalid || !this.selectedGuarantee) {
      Swal.fire('Thiếu thông tin', 'Vui lòng nhập đầy đủ dữ liệu', 'warning');
      return;
    }

    const payload = {
      manufacturerId: this.selectedBrand?.id,
      invoice: this.form.value,
      vehicles: this.form.value.vehicles.map((v: any, i: number) => ({
        ...v,
        valid: v.valid ?? true,
        stt: i + 1,
        price: Number(v.price),
        seats: Number(v.seats),
        guaranteeLetterDTO: {
          id: this.selectedGuarantee.id
        }
      }))
    };

    this.vehicleInvoiceService.create(payload).subscribe({
      next: res => {
        this.createdVehicles = res.vehicles ?? [];

        if (!this.createdVehicles.length) {
          Swal.fire('Lỗi', 'Không có xe được tạo', 'error');
          return;
        }

        this.uploadFilesForVehicles();

        // 🎉 HIỂN THỊ SWAL
        this.showSuccessConfirm();
      },
      error: () => {
        Swal.fire('Lỗi', 'Tạo hồ sơ thất bại', 'error');
      }
    });
  }
  private showSuccessConfirm(): void {
    Swal.fire({
      icon: 'success',
      title: 'Thêm hồ sơ thành công',
      text: 'Bạn muốn tiếp tục thêm hồ sơ với thư bảo lãnh hiện tại hay chọn thư khác?',
      showCancelButton: true,
      confirmButtonText: 'Tiếp tục thư hiện tại',
      cancelButtonText: 'Chọn thư khác',
      reverseButtons: true
    }).then(result => {
      if (result.isConfirmed) {
        // ➕ TIẾP TỤC THÊM VỚI THƯ HIỆN TẠI
        this.resetAfterSuccessKeepGuarantee();
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        // 🔁 CHỌN THƯ KHÁC
        this.backToBrand();
      }
    });
  }
  private resetAfterSuccessKeepGuarantee(): void {
    this.form.patchValue({
      invoiceNumber: '',
      invoiceDate: '',
      totalAmount: 0
    });

    this.vehicles.clear();
    this.files = [];
    this.vehicleFiles = [];

    // giữ nguyên:
    // this.selectedGuarantee
    // this.selectedBrand
    // currentStep = 2

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'info',
      title: 'Bạn có thể tiếp tục thêm xe',
      showConfirmButton: false,
      timer: 2000
    });
  }
  uploadFilesForVehicles(): void {

    this.createdVehicles.forEach((vehicle, index) => {

      const files = this.vehicleFiles[index];

      if (!files?.length || !vehicle.id) return;

      this.documentService.upload(files, vehicle.id)
        .subscribe({
          next: docs => {
            // vehicle.documentIds = docs?.map(d => d.id) ?? [];
          }
        });

    });

  }
  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.files = [input.files[0]];
      this.processOcr(); // Tự động xử lý khi có file
    }
  }

  processOcr(): void {
    if (this.files.length === 0) {
      Swal.fire('Chú ý', 'Vui lòng chọn file', 'warning');
      return;
    }

    const file = this.files[0];
    const fileName = file.name.toLowerCase();
    const isPdf = fileName.endsWith('.pdf');
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');

    if (!isPdf && !isExcel) {
      Swal.fire('Lỗi', 'Chỉ hỗ trợ file PDF hoặc Excel', 'error');
      return;
    }

    Swal.fire({
      title: 'Đang xử lý...',
      text: 'Vui lòng chờ trong giây lát',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    const request = isPdf
      ? this.vehicleInvoiceService.extractPdf(file)
      : this.vehicleInvoiceService.extractExcel(file);

    request.subscribe({
      next: (res) => {
        Swal.close();
        if (res && res.success) {
          if (isPdf) {
            this.handlePdfResponse(res.data);
          } else {
            this.handleExcelResponse(res.data);
          }

          this.activeTab = 'manual';
          Swal.fire('Thành công', 'Đã nhận diện dữ liệu thành công', 'success');
        } else {
          Swal.fire('Thông báo', 'Không tìm thấy dữ liệu từ file này', 'info');
        }
      },
      error: (err) => {
        Swal.close();
        Swal.fire('Lỗi', 'Không thể xử lý file này', 'error');
        console.error('Extraction Error:', err);
      }
    });
  }

  private handlePdfResponse(data: any): void {
    if (!data) return;
    this.form.patchValue({
      invoiceNumber: data.invoiceNumber || '',
    });

    const vehicleList = data.vehicleList || [];
    if (Array.isArray(vehicleList)) {
      this.vehicles.clear();
      vehicleList.forEach((v: any) => {
        const vehicleForm = this.createVehicleForm();
        vehicleForm.patchValue({
          vehicleName: v.vehicleDescription || '',
          chassisNumber: v.chassisNumber || '',
          engineNumber: v.engineNumber || '',
          modelType: v.modelType || '',
          color: v.color || '',
          seats: v.numberOfSeats || 5,
          price: v.price || 0,
          importDate: v.importDate || ''
        });
        this.vehicles.push(vehicleForm);
      });
    }
  }

  private handleExcelResponse(data: any[]): void {
    if (!data || !Array.isArray(data)) return;

    this.vehicles.clear();

    // Lấy số hóa đơn từ dòng đầu tiên có dữ liệu
    const firstInvoiceItem = data.find(item => item['Hóa đơn HTV']);
    if (firstInvoiceItem) {
      this.form.patchValue({ invoiceNumber: firstInvoiceItem['Hóa đơn HTV'] });
    }

    data.forEach((item: any) => {
      const stt = item['STT'];
      const chassisNumber = item['SỐ KHUNG'];

      // Chấp nhận STT là số hoặc chuỗi số, và phải có Số khung
      const hasValidStt = stt !== null && stt !== undefined && !isNaN(Number(stt));
      const isNotHeaderOrFooter = chassisNumber && !String(chassisNumber).includes('Ngày') && !String(stt).includes('STT');

      if (hasValidStt && isNotHeaderOrFooter && chassisNumber) {
        const vehicleForm = this.createVehicleForm();
        vehicleForm.patchValue({
          vehicleName: item['TÊN  XE TRÊN PHIẾU XUẤT XƯỞNG'] || '',
          chassisNumber: chassisNumber,
          engineNumber: item['SỐ MÁY'] || '',
          price: item['ĐƠN GIÁ'] || 0
        });
        this.vehicles.push(vehicleForm);
      }
    });
  }
  /* ================= RESET ================= */
  private resetForm(): void {
    this.form.reset();
    this.vehicles.clear();
    this.files = [];
  }
}