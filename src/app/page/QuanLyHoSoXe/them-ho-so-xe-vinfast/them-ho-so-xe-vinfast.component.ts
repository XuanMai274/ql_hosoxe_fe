import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Manufacturer } from '../../../models/manufacturer';
import { ManufacturerService } from '../../../service/manufacturer.service';
import { GuaranteeLetterService } from '../../../service/guarantee-letter.service';
import { forkJoin, of, Observable } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { VehicleInvoiceService } from '../../../service/vehicle-invoice.service';
import { DocumentService } from '../../../service/document.service';
import Swal from 'sweetalert2';

interface InvoiceData {
  invoiceNumber: string;
  totalAmount: number | null;
  day: string;
  month: string;
  year: string;
  vehicleList: VehicleData[];
  expanded?: boolean; // Cho accordion
}

interface VehicleData {
  vehicleDescription: string;
  modelName: string;
  origin: string;
  chassisNumber: string;
  engineNumber: string;
  color: string;
  numberOfSeats: string;
  quantity: string;
  unitPrice: string;
  isAutoFilled?: boolean;
  file: File | null;
}

interface GuaranteeGroup {
  code: string;
  invoices: InvoiceData[];
  expanded: boolean;
}

interface UploadedData {
  guarantees: GuaranteeGroup[];
}

@Component({
  selector: 'app-them-ho-so-xe-vinfast',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './them-ho-so-xe-vinfast.component.html',
  styleUrl: './them-ho-so-xe-vinfast.component.css'
})
export class ThemHoSoXeVinfastComponent {

  /* ================= BRAND - CỐ ĐỊNH CHO VINFAST ================= */
  selectedBrand: Manufacturer | null = null;
  readonly VINFAST_BRAND_CODE = 'VINFAST';

  /* ================= UPLOAD FILES ================= */
  excelFile: File | null = null;
  pdfFiles: File[] = [];
  isDragging: boolean = false;

  /* ================= PARSED DATA ================= */
  guaranteeGroups: GuaranteeGroup[] = []; // Cấu trúc 3 cấp mới

  /* ================= SUMMARY ================= */
  globalTotalInvoices: number = 0;
  globalTotalVehicles: number = 0;
  globalTotalAmount: number = 0;

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
    this.loadVinfastBrand();
  }

  loadVinfastBrand(): void {
    this.manufacturerService.getManufacture().subscribe({
      next: res => {
        console.log('📦 [VinFast] All Manufacturers from Server:', res);
        this.selectedBrand = res.find(b => b.code === this.VINFAST_BRAND_CODE) || null;
        console.log('🎯 Selected VinFast Brand:', this.selectedBrand);
        if (this.selectedBrand) {
          this.loadAvailableGuarantees();
        }
      },
      error: () => {
        console.error('❌ Failed to load VinFast brand info');
        Swal.fire('Lỗi', 'Không thể tải thông tin hãng VinFast', 'error');
      }
    });
  }

  loadAvailableGuarantees(): void {
    if (!this.selectedBrand) return;

    const brandCode = this.selectedBrand.code || '';
    console.log('📡 [1] Trying suggest API for VinFast:', brandCode);

    this.guaranteeLetterService.suggest('', brandCode).subscribe({
      next: (res: any) => {
        const data = res?.content || res || [];
        if (data.length > 0) {
          this.availableGuarantees = data;
          console.log(`📥 [1] Success: Loaded ${data.length} VinFast guarantees`);
        } else {
          console.warn(`⚠️ [1] Suggest empty. Trying [2] search API...`);
          this.loadViaSearch(brandCode);
        }
      },
      error: () => this.loadViaSearch(brandCode)
    });
  }

  private loadViaSearch(brandCode: string): void {
    console.log('📡 [2] Calling search API for VinFast...', brandCode);
    this.guaranteeLetterService.search('', brandCode, undefined, undefined, undefined, 0, 1000).subscribe({
      next: (res: any) => {
        const data = res?.content || res || [];
        this.availableGuarantees = data;
        console.log(`📥 [2] VinFast Search Result: Loaded ${data.length} guarantees`, data);

        if (data.length === 0 && brandCode !== '') {
          this.loadViaSearch('');
        }
      },
      error: (err) => {
        console.error('❌ VinFast Search failed:', err);
        this.availableGuarantees = [];
      }
    });
  }

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

  /* ================= FILE SELECTION & DRAG DROP ================= */
  onFileSelected(event: Event, type: 'excel' | 'pdf'): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    if (type === 'excel') {
      this.excelFile = input.files[0];
    } else {
      const files = Array.from(input.files);
      this.pdfFiles.push(...files);
    }
    input.value = ''; // Reset to allow re-selection
  }

  removeFile(type: 'excel' | 'pdf', index: number = 0): void {
    if (type === 'excel') this.excelFile = null;
    else this.pdfFiles.splice(index, 1);
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

    if (event.dataTransfer?.files) {
      const files = Array.from(event.dataTransfer.files);
      files.forEach(file => {
        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          this.excelFile = file;
        } else if (file.name.endsWith('.pdf')) {
          this.pdfFiles.push(file);
        }
      });
    }
  }

  /* ================= PROCESS FILES ================= */
  async processFiles(): Promise<void> {
    if (!this.excelFile && this.pdfFiles.length === 0) {
      Swal.fire('Chú ý', 'Vui lòng chọn ít nhất 1 file Excel hoặc PDF', 'warning');
      return;
    }

    this.isProcessing = true;
    Swal.fire({
      title: 'Đang xử lý...',
      text: 'Vui lòng chờ trong giây lát',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      if (this.pdfFiles.length > 1 || (this.pdfFiles.length > 0 && this.excelFile)) {
        await this.processPdfMultiple();
      } else if (this.pdfFiles.length === 1) {
        await this.processPdfSingle();
      } else if (this.excelFile) {
        await this.processExcelOnly();
      }

      this.hasData = true;
      this.isProcessing = false;
      this.calculateSummary();
      Swal.close();

      Swal.fire({
        icon: 'success',
        title: 'Thành công',
        html: `<div style="text-align: left; padding: 10px;">
          <p><strong>Mã bảo lãnh:</strong> ${this.guaranteeGroups.length}</p>
          <p><strong>Hóa đơn:</strong> ${this.globalTotalInvoices}</p>
          <p><strong>Số lượng xe:</strong> ${this.globalTotalVehicles}</p>
        </div>`
      });
    } catch (error) {
      this.isProcessing = false;
      Swal.close();
      Swal.fire('Lỗi', 'Không thể xử lý file. Vui lòng kiểm tra định dạng.', 'error');
    }
  }

  private processPdfMultiple(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.vehicleInvoiceService.extractPdfMultiple(this.pdfFiles, this.excelFile!).subscribe({
        next: (res) => {
          if (res && res.success && res.data) {
            this.parseApiResponse(res);
            resolve();
          } else reject();
        },
        error: (err) => reject(err)
      });
    });
  }

  private processPdfSingle(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.vehicleInvoiceService.extractPdf(this.pdfFiles[0]).subscribe({
        next: (res) => {
          if (res && res.success && res.data) {
            // Nếu data là mảng hoặc object gom nhóm thì parse luôn
            this.parseApiResponse(res);
            resolve();
          } else reject();
        },
        error: (err) => reject(err)
      });
    });
  }

  private processExcelOnly(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.vehicleInvoiceService.extractExcel(this.excelFile!).subscribe({
        next: (res) => {
          if (res && res.success && res.data) {
            this.parseApiResponse(res);
            resolve();
          } else reject();
        },
        error: (err) => reject(err)
      });
    });
  }

  /* ================= PARSE API RESPONSE ================= */
  private parseApiResponse(response: any): void {
    console.log('📦 Dữ liệu gốc từ API:', response);

    if (!response || !response.data) {
      console.warn('⚠️ Không có dữ liệu trong response.data');
      return;
    }

    const rawData = response.data;
    this.guaranteeGroups = [];

    // Helper để trích xuất mã bảo lãnh nếu cần
    const extractCodeFromStr = (str: string): string => {
      const match = str?.match(/GI[0-9A-Z]+/i);
      return match ? match[0].toUpperCase() : 'Mã chưa xác định';
    };

    // TRƯỜNG HỢP 1: Dữ liệu là Object (Key là mã bảo lãnh)
    if (typeof rawData === 'object' && !Array.isArray(rawData)) {
      console.log('🔍 Xử lý theo dạng Object Grouped (Key-Value)');

      const keys = Object.keys(rawData);
      if (keys.length === 0) {
        console.warn('⚠️ Object data rỗng');
        return;
      }

      keys.forEach((key, gIdx) => {
        const invoicesArray = rawData[key];
        console.log(`Key: ${key}, Số hóa đơn: ${invoicesArray?.length}`);

        if (Array.isArray(invoicesArray)) {
          this.guaranteeGroups.push({
            code: key, // Lấy chính xác KEY làm mã bảo lãnh
            expanded: true,
            invoices: invoicesArray.map((item: any, iIdx: number) => ({
              invoiceNumber: item.invoiceNumber || '',
              totalAmount: this.parsePrice(item.totalAmount),
              day: item.day || '',
              month: item.month || '',
              year: item.year || '',
              vehicleList: (item.vehicleList || []).map((v: any) => {
                const model = v.modelName || (v as any).vehicle_name || (v as any).asset_name || v.vehicleDescription || '';
                const origin = v.origin || 'Việt Nam';
                const newV = {
                  ...v,
                  modelName: model,
                  origin: origin,
                  numberOfSeats: v.numberOfSeats || '7',
                  vehicleDescription: '',
                  isAutoFilled: true,
                  file: null
                };
                this.generateVehicleDescription(newV, 'VINFAST');
                return newV;
              }),
              expanded: true
            }))
          });
        }
      });
    }
    // TRƯỜNG HỢP 2: Dữ liệu là mảng phẳng
    else if (Array.isArray(rawData)) {
      console.log('🔍 Xử lý theo dạng mảng phẳng');
      let code = extractCodeFromStr(response.message);

      this.guaranteeGroups.push({
        code: code,
        expanded: true,
        invoices: rawData.map((item: any, index: number) => ({
          ...item,
          totalAmount: this.parsePrice(item.totalAmount),
          expanded: true,
          vehicleList: (item.vehicleList || []).map((v: any) => {
            const model = v.modelName || (v as any).vehicle_name || (v as any).asset_name || v.vehicleDescription || '';
            const origin = v.origin || 'Việt Nam';
            const newV = {
              ...v,
              modelName: model,
              origin: origin,
              numberOfSeats: v.numberOfSeats || '7',
              vehicleDescription: '',
              isAutoFilled: true,
              file: null
            };
            this.generateVehicleDescription(newV, 'VINFAST');
            return newV;
          })
        }))
      });
    }

    console.log('✅ Kết quả sau khi parse:', this.guaranteeGroups);
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
        const invVehicles = inv.vehicleList?.length || 0;
        this.globalTotalVehicles += invVehicles;
        this.globalTotalAmount += this.getInvoiceTotal(inv);
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
    // Thêm sẵn 1 hóa đơn trống cho mã mới
    this.addInvoiceToGuarantee(this.guaranteeGroups.length - 1);
  }

  toggleGuarantee(index: number): void {
    this.guaranteeGroups[index].expanded = !this.guaranteeGroups[index].expanded;
  }

  removeGuarantee(index: number): void {
    Swal.fire({
      title: 'Xóa mã bảo lãnh?',
      text: "Toàn bộ hóa đơn và xe thuộc mã này sẽ bị xóa!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#028B89',
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
    this.guaranteeGroups[gIdx].invoices.push({
      invoiceNumber: '',
      totalAmount: null,
      day: '',
      month: '',
      year: '',
      vehicleList: [],
      expanded: true
    });
    this.guaranteeGroups[gIdx].expanded = true;
    this.calculateSummary();
  }

  toggleInvoice(gIdx: number, iIdx: number): void {
    this.guaranteeGroups[gIdx].invoices[iIdx].expanded = !this.guaranteeGroups[gIdx].invoices[iIdx].expanded;
  }

  removeInvoice(gIdx: number, iIdx: number): void {
    Swal.fire({
      title: 'Xóa hóa đơn?',
      text: "Dữ liệu xe trong hóa đơn này sẽ mất!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#028B89',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    }).then((result) => {
      if (result.isConfirmed) {
        this.guaranteeGroups[gIdx].invoices.splice(iIdx, 1);
        this.calculateSummary();
      }
    });
  }

  uploadInvoicePdf(event: Event, gIdx: number, iIdx: number): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    Swal.fire({ title: 'Đang xử lý PDF...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    this.vehicleInvoiceService.extractPdf(file).subscribe({
      next: (res) => {
        if (res && res.success && res.data) {
          const inv = this.guaranteeGroups[gIdx].invoices[iIdx];
          const data = res.data;

          if (!inv.invoiceNumber) {
            inv.invoiceNumber = data.invoiceNumber || '';
            inv.day = data.day || '';
            inv.month = data.month || '';
            inv.year = data.year || '';
          }

          const newVehicles = (data.vehicleList || []).map((v: any) => ({
            ...v,
            isAutoFilled: true
          }));

          inv.vehicleList.push(...newVehicles);
          this.calculateSummary();
          Swal.fire('Thành công', `Đã thêm ${newVehicles.length} xe`, 'success');
        } else {
          Swal.fire('Lỗi', 'Không thể đọc dữ liệu PDF', 'error');
        }
        input.value = '';
      },
      error: () => {
        Swal.close();
        Swal.fire('Lỗi', 'Xử lý thất bại', 'error');
      }
    });
  }

  /* ================= LEVEL 3: VEHICLE ACTIONS ================= */
  addVehicleToInvoice(gIdx: number, iIdx: number): void {
    this.guaranteeGroups[gIdx].invoices[iIdx].vehicleList.push({
      vehicleDescription: '',
      modelName: '',
      origin: 'Việt Nam',
      chassisNumber: '',
      engineNumber: '',
      color: '',
      numberOfSeats: '7',
      quantity: '1',
      unitPrice: '0',
      isAutoFilled: false,
      file: null
    });
    this.calculateSummary();
  }

  uploadVehicleFile(event: Event, gIdx: number, iIdx: number, vIdx: number): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.guaranteeGroups[gIdx].invoices[iIdx].vehicleList[vIdx].file = input.files[0];
      Swal.fire({
        icon: 'success',
        title: 'Đã đính kèm file',
        text: `File: ${input.files[0].name}`,
        timer: 1500,
        showConfirmButton: false
      });
    }
  }

  updateVehicle(gIdx: number, iIdx: number, vIdx: number, field: string, value: any): void {
    const vehicle = this.guaranteeGroups[gIdx].invoices[iIdx].vehicleList[vIdx];
    (vehicle as any)[field] = value;
    this.calculateSummary();
  }

  removeVehicle(gIdx: number, iIdx: number, vIdx: number): void {
    this.guaranteeGroups[gIdx].invoices[iIdx].vehicleList.splice(vIdx, 1);
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

  formatPrice(price: any): string {
    const num = this.parsePrice(price);
    return num === 0 ? '0' : num.toLocaleString('vi-VN');
  }

  getInvoiceTotal(invoice: InvoiceData): number {
    return (invoice.vehicleList || []).reduce((sum, v) => {
      return sum + (this.parsePrice(v.unitPrice) * (parseInt(v.quantity) || 1));
    }, 0);
  }

  /* ================= RESET & SUBMIT ================= */
  resetAll(): void {
    this.excelFile = null;
    this.pdfFiles = [];
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

    const invalidGroups = this.guaranteeGroups.filter(g => !g.code);
    if (invalidGroups.length > 0) {
      Swal.fire('Lỗi', 'Có nhóm chưa nhập mã bảo lãnh', 'error');
      return;
    }

    const saveRequests: Observable<any>[] = [];
    let missingGuarantees: string[] = [];

    console.log('🔍 Starting submitData VinFast - Available Guarantees:', this.availableGuarantees);

    this.guaranteeGroups.forEach(group => {
      console.log('🔎 Searching for Guarantee Code:', group.code);
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
            invoiceDate: `${inv.year}-${inv.month}-${inv.day}`,
            totalAmount: this.getInvoiceTotal(inv)
          },
          vehicles: inv.vehicleList.map((v, vIdx) => ({
            stt: vIdx + 1,
            vehicleName: v.modelName, // Tên xe (VF8, VF9...) -> asset_name
            description: v.vehicleDescription, // Nội dung chi tiết hóa đơn -> description
            chassisNumber: v.chassisNumber,
            engineNumber: v.engineNumber,
            modelType: v.modelName, // Clean model name
            color: v.color || '',
            seats: Number(v.numberOfSeats) || 7,
            price: this.parsePrice(v.unitPrice),
            status: 'Giữ két',
            guaranteeLetterDTO: {
              id: guarantee.id
            }
          }))
        };
        console.log('📤 Submitting VinFast Payload:', payload);

        saveRequests.push(
          this.vehicleInvoiceService.create(payload as any).pipe(
            switchMap((res: any) => {
              if (res && !res.error && res.vehicles) {
                this.uploadFilesForVehicles(res.vehicles, inv.vehicleList);
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

    Swal.fire({
      title: 'Đang lưu dữ liệu...',
      text: `Đang xử lý ${saveRequests.length} hóa đơn VinFast`,
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    forkJoin(saveRequests).subscribe({
      next: (results) => {
        Swal.close();
        const failures = results.filter(r => r && r.error);

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
