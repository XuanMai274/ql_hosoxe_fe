import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Manufacturer } from '../../../models/manufacturer';
import { ManufacturerService } from '../../../service/manufacturer.service';
import { FormsModule } from '@angular/forms';
import { VehicleInvoiceService } from '../../../service/vehicle-invoice.service';
import { GuaranteeLetterService } from '../../../service/guarantee-letter.service';
import { forkJoin, of, Observable } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { DocumentService } from '../../../service/document.service';
import Swal from 'sweetalert2';

interface VehicleData {
  vehicleDescription: string;
  modelName: string;
  origin: string;
  chassisNumber: string;
  engineNumber: string;
  guaranteeNumber: string;
  contractNumber: string;
  invoiceNumber: string;
  dealerName: string;
  unitPrice: string;
  color?: string;
  numberOfSeats?: string;
  isAutoFilled?: boolean;
  file: File | null;
}

interface InvoiceGroup {
  invoiceNumber: string;
  invoiceDate: string; // Thêm ngày hóa đơn
  dealerName: string;
  contractNumber: string;
  vehicles: VehicleData[];
  expanded: boolean;
}

interface GuaranteeGroup {
  code: string;
  invoices: InvoiceGroup[];
  expanded: boolean;
}

@Component({
  selector: 'app-them-ho-so-xe-hyundai',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './them-ho-so-xe-hyundai.component.html',
  styleUrl: './them-ho-so-xe-hyundai.component.css'
})
export class ThemHoSoXeHyundaiComponent {

  /* ================= BRAND - CỐ ĐỊNH CHO HYUNDAI ================= */
  selectedBrand: Manufacturer | null = null;
  readonly HYUNDAI_BRAND_CODE = 'HYUNDAI';

  /* ================= UPLOAD FILES ================= */
  excelFile: File | null = null;
  isDragging: boolean = false;

  /* ================= PARSED DATA ================= */
  guaranteeGroups: GuaranteeGroup[] = [];

  /* ================= SUMMARY ================= */
  globalTotalInvoices: number = 0;
  globalTotalVehicles: number = 0;
  globalTotalAmount: number = 0;
  vatPercent: number = 10;
  manufacturer?: Manufacturer;
  code: string = 'HYUNDAI';
  /* ================= GUARANTEE DATA ================= */
  availableGuarantees: any[] = [];

  /* ================= UI STATE ================= */
  isProcessing: boolean = false;
  hasData: boolean = false;
  inputMode: 'upload' | 'manual' = 'upload';
  createdVehicles: any[] = [];

  constructor(
    private manufacturerService: ManufacturerService,
    private vehicleInvoiceService: VehicleInvoiceService,
    private guaranteeLetterService: GuaranteeLetterService,
    private documentService: DocumentService
  ) { }

  ngOnInit(): void {
    this.loadHyundaiBrand();
    this.loadManufacturer()
  }
  loadManufacturer() {
    if (!this.code) return;

    this.manufacturerService.getByCode(this.code).subscribe({
      next: (res) => {
        this.manufacturer = res;
      },
      error: (err) => {
        console.error('Không tìm thấy hãng:', err);
        this.manufacturer = undefined;
      }
    });
  }

  loadHyundaiBrand(): void {
    this.manufacturerService.getManufacture().subscribe({
      next: res => {
        console.log('📦 All Manufacturers from Server:', res);
        this.selectedBrand = res.find(b => b.code === this.HYUNDAI_BRAND_CODE) || null;
        console.log('🎯 Selected Hyundai Brand:', this.selectedBrand);
        if (this.selectedBrand) {
          this.loadAvailableGuarantees();
        }
      },
      error: () => {
        Swal.fire('Lỗi', 'Không thể tải thông tin hãng Hyundai', 'error');
      }
    });
  }

  loadAvailableGuarantees(): void {
    if (!this.selectedBrand) return;

    const brandCode = this.selectedBrand.code || '';
    console.log('📡 [1] Trying suggest API for brand:', brandCode);

    this.guaranteeLetterService.suggest('', brandCode).subscribe({
      next: (res: any) => {
        const data = res?.content || res || [];
        if (data.length > 0) {
          this.availableGuarantees = data;
          console.log(`📥 [1] Success: Loaded ${data.length} guarantees from suggest`);
        } else {
          console.warn(`⚠️ [1] Suggest empty. Trying [2] search API...`);
          this.loadViaSearch(brandCode);
        }
      },
      error: () => this.loadViaSearch(brandCode)
    });
  }

  private loadViaSearch(brandCode: string): void {
    console.log('📡 [2] Calling search API for all statuses...', brandCode);
    // Gọi search với size lớn để lấy tất cả (kể cả chưa duyệt)
    this.guaranteeLetterService.search('', brandCode, undefined, undefined, undefined, 0, 1000).subscribe({
      next: (res: any) => {
        const data = res?.content || res || [];
        this.availableGuarantees = data;
        console.log(`📥 [2] Search Result: Loaded ${data.length} guarantees`, data);

        if (data.length === 0 && brandCode !== '') {
          console.warn('⚠️ Brand Search empty. Trying [3] Global Search...');
          this.loadViaSearch(''); // Fallback cuối cùng: tìm trên toàn bộ hệ thống
        }
      },
      error: (err) => {
        console.error('❌ Search failed:', err);
        this.availableGuarantees = [];
      }
    });
  }

  /* ================= MODE SWITCHING ================= */
  setInputMode(mode: 'upload' | 'manual'): void {
    this.inputMode = mode;
    if (mode === 'manual') {
      this.resetAll();
    }
  }

  startManualEntry(): void {
    this.hasData = true;
    this.inputMode = 'manual';
    if (this.guaranteeGroups.length === 0) {
      this.addGuaranteeGroup();
    }
  }

  /* ================= FILE SELECTION ================= */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    this.excelFile = input.files[0];
    input.value = '';
  }

  removeFile(): void {
    this.excelFile = null;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        this.excelFile = file;
      } else {
        Swal.fire('Lỗi', 'Chỉ hỗ trợ file Excel (.xlsx, .xls)', 'error');
      }
    }
  }

  /* ================= PROCESS FILES ================= */
  processExcel(): void {
    if (!this.excelFile) {
      Swal.fire('Chú ý', 'Vui lòng chọn file Excel', 'warning');
      return;
    }

    this.isProcessing = true;
    Swal.fire({
      title: 'Đang xử lý...',
      text: 'Vui lòng trích xuất dữ liệu Hyundai',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    this.vehicleInvoiceService.extractHyundaiExcel(this.excelFile).subscribe({
      next: (res) => {
        Swal.close();
        if (res && res.success && res.data) {
          this.parseApiResponse(res);
          this.hasData = true;
          this.isProcessing = false;

          Swal.fire({
            icon: 'success',
            title: 'Thành công',
            html: `<div style="text-align: left; padding: 10px;">
              <p><strong>Số lượng thư:</strong> ${this.guaranteeGroups.length}</p>
              <p><strong>Số lượng hóa đơn:</strong> ${this.globalTotalInvoices}</p>
              <p><strong>Số lượng xe:</strong> ${this.globalTotalVehicles}</p>
            </div>`
          });
        } else {
          this.isProcessing = false;
          Swal.fire('Thông báo', 'Không tìm thấy dữ liệu hoặc định dạng không đúng', 'info');
        }
      },
      error: (err) => {
        this.isProcessing = false;
        Swal.close();
        Swal.fire('Lỗi', 'Không thể kết nối đến máy chủ hoặc xử lý file thất bại', 'error');
        console.error('Hyundai Extraction Error:', err);
      }
    });
  }

  /* ================= PARSE API RESPONSE ================= */
  private parseApiResponse(response: any): void {
    console.log('📦 Hyundai Raw Data:', response.data);
    const rawData = response.data;
    this.guaranteeGroups = [];

    // Duyệt qua từng mã bảo lãnh (Key của Object)
    Object.keys(rawData).forEach((guaranteeCode, gIdx) => {
      const vehicles: VehicleData[] = rawData[guaranteeCode];

      // Gom nhóm vehicles theo invoiceNumber trong mỗi mã bảo lãnh
      const invoiceMap = new Map<string, VehicleData[]>();
      vehicles.forEach(v => {
        const invNo = v.invoiceNumber || 'HĐ-CHƯA-XÁC-ĐỊNH';
        if (!invoiceMap.has(invNo)) {
          invoiceMap.set(invNo, []);
        }

        const newVehicle: VehicleData = {
          ...v,
          // Ưu tiên trích xuất tên xe từ các trường khả thi nhất
          modelName: v.modelName || (v as any).vehicle_name || (v as any).asset_name || v.vehicleDescription || '',
          origin: v.origin || 'Việt Nam',
          numberOfSeats: v.numberOfSeats || '',
          isAutoFilled: true,
          file: null
        };

        // Tự động tạo mô tả đầy đủ từ modelName
        this.generateVehicleDescription(newVehicle, 'HYUNDAI');

        invoiceMap.get(invNo)!.push(newVehicle);
      });

      const invoiceGroups: InvoiceGroup[] = [];
      const today = new Date().toISOString().split('T')[0];
      invoiceMap.forEach((vList, invNo) => {
        invoiceGroups.push({
          invoiceNumber: invNo === 'HĐ-CHƯA-XÁC-ĐỊNH' ? '' : invNo,
          invoiceDate: today, // Mặc định hôm nay nếu excel k có
          dealerName: vList[0].dealerName || '',
          contractNumber: vList[0].contractNumber || '',
          vehicles: vList,
          expanded: true
        });
      });

      this.guaranteeGroups.push({
        code: guaranteeCode,
        invoices: invoiceGroups,
        expanded: true
      });
    });

    this.calculateSummary();
  }

  /* ================= CALCULATE SUMMARY ================= */
  private calculateSummary(): void {
    this.globalTotalInvoices = 0;
    this.globalTotalVehicles = 0;
    this.globalTotalAmount = 0;

    this.guaranteeGroups.forEach(group => {
      this.globalTotalInvoices += group.invoices.length;
      group.invoices.forEach(inv => {
        this.globalTotalVehicles += inv.vehicles.length;
        inv.vehicles.forEach(v => {
          this.globalTotalAmount += this.calculatePriceWithVat(v.unitPrice);
        });
      });
    });
  }

  /* ================= LEVEL 1: GUARANTEE ACTIONS ================= */
  addGuaranteeGroup(): void {
    this.guaranteeGroups.push({
      code: '',
      invoices: [],
      expanded: true
    });
    this.addInvoiceToGuarantee(this.guaranteeGroups.length - 1);
  }

  toggleGuarantee(index: number): void {
    this.guaranteeGroups[index].expanded = !this.guaranteeGroups[index].expanded;
  }

  removeGuarantee(index: number): void {
    Swal.fire({
      title: 'Xóa thư bảo lãnh?',
      text: "Toàn bộ hóa đơn và xe thuộc mã này sẽ bị xóa!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#002c5f',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    }).then((result) => {
      if (result.isConfirmed) {
        this.guaranteeGroups.splice(index, 1);
        this.calculateSummary();
      }
    });
  }

  /* ================= LEVEL 2: INVOICE ACTIONS ================= */
  addInvoiceToGuarantee(gIdx: number): void {
    const now = new Date();
    const yLocal = now.getFullYear();
    const mLocal = (now.getMonth() + 1).toString().padStart(2, '0');
    const dLocal = now.getDate().toString().padStart(2, '0');

    this.guaranteeGroups[gIdx].invoices.push({
      invoiceNumber: '',
      invoiceDate: `${yLocal}-${mLocal}-${dLocal}`,
      dealerName: '',
      contractNumber: '',
      vehicles: [],
      expanded: true
    });
    this.guaranteeGroups[gIdx].expanded = true;
    this.calculateSummary();
  }

  toggleInvoice(gIdx: number, iIdx: number): void {
    this.guaranteeGroups[gIdx].invoices[iIdx].expanded = !this.guaranteeGroups[gIdx].invoices[iIdx].expanded;
  }

  removeInvoice(gIdx: number, iIdx: number): void {
    this.guaranteeGroups[gIdx].invoices.splice(iIdx, 1);
    this.calculateSummary();
  }

  /* ================= LEVEL 3: VEHICLE ACTIONS ================= */
  addVehicleToInvoice(gIdx: number, iIdx: number): void {
    this.guaranteeGroups[gIdx].invoices[iIdx].vehicles.push({
      vehicleDescription: '',
      modelName: '',
      origin: 'Việt Nam',
      chassisNumber: '',
      engineNumber: '',
      color: '',
      numberOfSeats: '',
      guaranteeNumber: this.guaranteeGroups[gIdx].code,
      contractNumber: this.guaranteeGroups[gIdx].invoices[iIdx].contractNumber,
      invoiceNumber: this.guaranteeGroups[gIdx].invoices[iIdx].invoiceNumber,
      dealerName: this.guaranteeGroups[gIdx].invoices[iIdx].dealerName,
      unitPrice: '0',
      isAutoFilled: false,
      file: null
    });
    this.calculateSummary();
  }

  uploadVehicleFile(event: Event, gIdx: number, iIdx: number, vIdx: number): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.guaranteeGroups[gIdx].invoices[iIdx].vehicles[vIdx].file = input.files[0];
      Swal.fire({
        icon: 'success',
        title: 'Đã đính kèm file',
        text: `File: ${input.files[0].name}`,
        timer: 1500,
        showConfirmButton: false
      });
    }
  }

  removeVehicle(gIdx: number, iIdx: number, vIdx: number): void {
    this.guaranteeGroups[gIdx].invoices[iIdx].vehicles.splice(vIdx, 1);
    this.calculateSummary();
  }

  updateVehiclePrice(gIdx: number, iIdx: number, vIdx: number, value: any): void {
    this.guaranteeGroups[gIdx].invoices[iIdx].vehicles[vIdx].unitPrice = value;
    this.calculateSummary();
  }

  /* ================= UTILITIES ================= */
  parsePrice(price: any): number {
    if (!price) return 0;
    if (typeof price === 'number') return price;
    const cleaned = price.toString().replace(/[^0-9]/g, '');
    return parseInt(cleaned) || 0;
  }

  formatCurrency(amount: number): string {
    return (amount || 0).toLocaleString('vi-VN') + ' VNĐ';
  }

  getInvoiceTotal(invoice: InvoiceGroup): number {
    return invoice.vehicles.reduce((sum, v) => sum + this.calculatePriceWithVat(v.unitPrice), 0);
  }

  updateVatPercent(value: any): void {
    this.vatPercent = Number(value) || 0;
    this.calculateSummary();
  }

  calculatePriceWithVat(unitPrice: any): number {
    const price = this.parsePrice(unitPrice);
    return price + (price * (this.vatPercent || 0) / 100);
  }

  /* ================= RESET & SUBMIT ================= */
  resetAll(): void {
    this.excelFile = null;
    this.guaranteeGroups = [];
    this.hasData = false;
    this.globalTotalInvoices = 0;
    this.globalTotalVehicles = 0;
    this.globalTotalAmount = 0;
  }

  submitData(): void {
    if (this.guaranteeGroups.length === 0) {
      Swal.fire('Chú ý', 'Không có dữ liệu để lưu', 'warning');
      return;
    }

    // 1. Kiểm tra mã bảo lãnh hợp lệ
    const invalidGroups = this.guaranteeGroups.filter(g => !g.code);
    if (invalidGroups.length > 0) {
      Swal.fire('Lỗi', 'Có nhóm chưa nhập mã bảo lãnh', 'error');
      return;
    }

    // 2. Gom nhóm các yêu cầu lưu API
    const saveRequests: Observable<any>[] = [];
    let missingGuarantees: string[] = [];

    console.log('🔍 Starting submitData - Available Guarantees:', this.availableGuarantees);

    this.guaranteeGroups.forEach(group => {
      console.log('🔎 Searching for Guarantee Code:', group.code);
      // Tìm ID của thư bảo lãnh từ danh sách gợi ý
      const guarantee = this.availableGuarantees.find(ag => {
        const matchesNotice = ag.guaranteeNoticeNumber && ag.guaranteeNoticeNumber === group.code;
        const matchesRef = ag.referenceCode && ag.referenceCode === group.code;
        const matchesContract = ag.guaranteeContractNumber && ag.guaranteeContractNumber === group.code;
        return matchesNotice || matchesRef || matchesContract;
      });
      console.log('✅ Found Guarantee:', guarantee);

      if (!guarantee) {
        missingGuarantees.push(group.code);
        return;
      }

      group.invoices.forEach(inv => {
        const payload = {
          manufacturerId: this.selectedBrand?.id,
          invoice: {
            invoiceNumber: inv.invoiceNumber,
            invoiceDate: inv.invoiceDate,
            totalAmount: this.getInvoiceTotal(inv)
          },
          vehicles: inv.vehicles.map((v, vIdx) => ({
            stt: vIdx + 1,
            vehicleName: v.modelName, // Tên xe (Model) -> asset_name
            description: v.vehicleDescription, // Nội dung chi tiết -> description
            chassisNumber: v.chassisNumber,
            engineNumber: v.engineNumber,
            modelType: v.modelName, // Vẫn giữ modelType nếu backend cần
            color: v.color || '',
            seats: Number(v.numberOfSeats) || 0,
            price: this.calculatePriceWithVat(v.unitPrice),
            status: 'Giữ két',
            guaranteeLetterDTO: {
              id: guarantee.id
            },
            manufacturerDTO: {
              id: this.manufacturer?.id
            }
          }))
        };
        console.log('📤 Submitting Payload:', payload);

        saveRequests.push(
          this.vehicleInvoiceService.create(payload as any).pipe(
            switchMap((res: any) => {
              if (res && !res.error && res.vehicles) {
                this.uploadFilesForVehicles(res.vehicles, inv.vehicles);
              }
              return of(res);
            }),
            catchError(err => {
              console.error(`Lỗi lưu HĐ ${inv.invoiceNumber}:`, err);
              return of({ error: true, invoiceNumber: inv.invoiceNumber });
            })
          )
        );
      });
    });

    if (missingGuarantees.length > 0) {
      Swal.fire('Lỗi', `Các mã bảo lãnh sau không tồn tại trên hệ thống: ${missingGuarantees.join(', ')}`, 'error');
      return;
    }

    if (saveRequests.length === 0) {
      Swal.fire('Chú ý', 'Không có hóa đơn hợp lệ để lưu', 'warning');
      return;
    }

    // 3. Thực thi lưu
    Swal.fire({
      title: 'Đang lưu dữ liệu...',
      text: `Đang xử lý ${saveRequests.length} hóa đơn`,
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    forkJoin(saveRequests).subscribe({
      next: (results) => {
        Swal.close();
        const failures = results.filter((r: any) => r && r.error);

        if (failures.length === 0) {
          this.showSuccessConfirm();
        } else {
          Swal.fire({
            icon: 'warning',
            title: 'Hoàn tất một phần',
            text: `Đã lưu ${results.length - failures.length} hóa đơn. Có ${failures.length} hóa đơn bị lỗi.`
          });
        }
      },
      error: () => {
        Swal.close();
        Swal.fire('Lỗi', 'Quá trình lưu dữ liệu gặp sự cố kỹ thuật', 'error');
      }
    });
  }

  uploadFilesForVehicles(resVehicles: any[], localVehicles: VehicleData[]): void {
    resVehicles.forEach((vehicle, index) => {
      const original = localVehicles[index];
      if (!original?.file || !vehicle.id) return;

      this.documentService.upload([original.file], vehicle.id).subscribe({
        next: () => console.log(`Uploaded file for vehicle ${vehicle.id}`),
        error: (err) => console.error(`Failed to upload file for vehicle ${vehicle.id}`, err)
      });
    });
  }

  private showSuccessConfirm(): void {
    Swal.fire({
      icon: 'success',
      title: 'Hoàn tất',
      text: 'Đã lưu thành công dữ liệu và đính kèm các tệp tin vào hệ thống.',
      confirmButtonText: 'Đóng'
    }).then(() => {
      this.resetAll();
    });
  }

  generateVehicleDescription(v: VehicleData, brand: string): void {
    const brandName = brand.toUpperCase();
    const model = v.modelName ? v.modelName.trim() : '';
    const origin = v.origin ? v.origin.trim() : 'Việt Nam';
    v.vehicleDescription = `Xe ô tô chở người ${brandName} ${model} mới 100% xuất xứ ${origin}`;
  }

}
