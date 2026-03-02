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
  invoiceDate: string; // Sử dụng 1 trường date duy nhất
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

    const now = new Date();
    const currentDay = now.getDate().toString().padStart(2, '0');
    const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0');
    const currentYear = now.getFullYear().toString();

    // TRƯỜNG HỢP 1: Dữ liệu là Object (Key là mã bảo lãnh)
    if (typeof rawData === 'object' && !Array.isArray(rawData)) {
      console.log('🔍 Xử lý theo dạng Object Grouped (Key-Value)');

      const keys = Object.keys(rawData);
      keys.forEach((key) => {
        const invoicesArray = rawData[key];
        if (Array.isArray(invoicesArray)) {
          this.guaranteeGroups.push({
            code: key,
            expanded: true,
            invoices: invoicesArray.map((item: any) => {
              const d = item.day || currentDay;
              const m = item.month || currentMonth;
              const y = item.year || currentYear;
              return {
                invoiceNumber: item.invoiceNumber || '',
                totalAmount: this.parsePrice(item.totalAmount),
                invoiceDate: `${y}-${m}-${d}`,
                day: d, month: m, year: y,
                vehicleList: (item.vehicleList || []).map((v: any) => {
                  const model = v.modelName || v.vehicleDescription || '';
                  const newV = {
                    ...v,
                    modelName: model,
                    origin: v.origin || 'Việt Nam',
                    numberOfSeats: v.numberOfSeats || '7',
                    vehicleDescription: '',
                    isAutoFilled: true,
                    file: null
                  };
                  this.generateVehicleDescription(newV, 'VINFAST');
                  return newV;
                }),
                expanded: true
              };
            })
          });
        }
      });
    }
    // TRƯỜNG HỢP 2: Dữ liệu là mảng phẳng
    else if (Array.isArray(rawData)) {
      let code = extractCodeFromStr(response.message);
      this.guaranteeGroups.push({
        code: code,
        expanded: true,
        invoices: rawData.map((item: any) => {
          const d = item.day || currentDay;
          const m = item.month || currentMonth;
          const y = item.year || currentYear;
          return {
            ...item,
            totalAmount: this.parsePrice(item.totalAmount),
            invoiceDate: `${y}-${m}-${d}`,
            day: d, month: m, year: y,
            expanded: true,
            vehicleList: (item.vehicleList || []).map((v: any) => {
              const model = v.modelName || v.vehicleDescription || '';
              const newV = {
                ...v,
                modelName: model,
                origin: v.origin || 'Việt Nam',
                numberOfSeats: v.numberOfSeats || '7',
                vehicleDescription: '',
                isAutoFilled: true,
                file: null
              };
              this.generateVehicleDescription(newV, 'VINFAST');
              return newV;
            })
          };
        })
      });
    }

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
        this.globalTotalVehicles += inv.vehicleList?.length || 0;
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
    const now = new Date();
    const yLocal = now.getFullYear();
    const mLocal = (now.getMonth() + 1).toString().padStart(2, '0');
    const dLocal = now.getDate().toString().padStart(2, '0');

    this.guaranteeGroups[gIdx].invoices.push({
      invoiceNumber: '',
      totalAmount: null,
      invoiceDate: `${yLocal}-${mLocal}-${dLocal}`,
      day: dLocal,
      month: mLocal,
      year: yLocal.toString(),
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
      icon: 'warning',
      showCancelButton: true,
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
            const now = new Date();
            const d = data.day || now.getDate().toString().padStart(2, '0');
            const m = data.month || (now.getMonth() + 1).toString().padStart(2, '0');
            const y = data.year || now.getFullYear().toString();
            inv.invoiceNumber = data.invoiceNumber || '';
            inv.invoiceDate = `${y}-${m}-${d}`;
            inv.day = d; inv.month = m; inv.year = y;
          }
          inv.vehicleList.push(...(data.vehicleList || []).map((v: any) => ({ ...v, isAutoFilled: true })));
          this.calculateSummary();
          Swal.fire('Thành công', `Đã thêm xe`, 'success');
        } else Swal.fire('Lỗi', 'Không thể đọc dữ liệu PDF', 'error');
        input.value = '';
      },
      error: () => { Swal.close(); Swal.fire('Lỗi', 'Xử lý thất bại', 'error'); }
    });
  }

  /* ================= LEVEL 3: VEHICLE ACTIONS ================= */
  addVehicleToInvoice(gIdx: number, iIdx: number): void {
    this.guaranteeGroups[gIdx].invoices[iIdx].vehicleList.push({
      vehicleDescription: '', modelName: '', origin: 'Việt Nam', chassisNumber: '',
      engineNumber: '', color: '', numberOfSeats: '7', quantity: '1', unitPrice: '0',
      isAutoFilled: false, file: null
    });
    this.calculateSummary();
  }

  uploadVehicleFile(event: Event, gIdx: number, iIdx: number, vIdx: number): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.guaranteeGroups[gIdx].invoices[iIdx].vehicleList[vIdx].file = input.files[0];
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
    return parseInt(price.toString().replace(/[^0-9]/g, '')) || 0;
  }

  formatCurrency(amount: number): string {
    return (amount || 0).toLocaleString('vi-VN') + ' VNĐ';
  }

  formatPrice(price: any): string {
    return this.parsePrice(price).toLocaleString('vi-VN');
  }

  getInvoiceTotal(invoice: InvoiceData): number {
    return (invoice.vehicleList || []).reduce((sum, v) => sum + (this.parsePrice(v.unitPrice) * (parseInt(v.quantity) || 1)), 0);
  }

  resetAll(): void {
    this.excelFile = null; this.pdfFiles = []; this.guaranteeGroups = []; this.hasData = false;
    this.globalTotalInvoices = 0; this.globalTotalVehicles = 0; this.globalTotalAmount = 0;
  }

  submitData(): void {
    if (this.guaranteeGroups.length === 0) return;
    const saveRequests: Observable<any>[] = [];
    this.guaranteeGroups.forEach(group => {
      const guarantee = this.availableGuarantees.find(ag => ag.guaranteeNoticeNumber === group.code || ag.referenceCode === group.code || ag.guaranteeContractNumber === group.code);
      if (!guarantee) return;
      group.invoices.forEach(inv => {
        const payload = {
          manufacturerId: this.selectedBrand?.id,
          invoice: { invoiceNumber: inv.invoiceNumber, invoiceDate: inv.invoiceDate, totalAmount: this.getInvoiceTotal(inv) },
          vehicles: inv.vehicleList.map((v, vIdx) => ({
            stt: vIdx + 1, vehicleName: v.modelName, description: v.vehicleDescription, chassisNumber: v.chassisNumber,
            engineNumber: v.engineNumber, modelType: v.modelName, color: v.color || '', seats: Number(v.numberOfSeats) || 7,
            price: this.parsePrice(v.unitPrice), status: 'Giữ két', guaranteeLetterDTO: { id: guarantee.id }, manufacturerDTO: { id: this.selectedBrand?.id }
          }))
        };
        saveRequests.push(this.vehicleInvoiceService.create(payload as any).pipe(
          switchMap((res: any) => { if (res && res.vehicles) this.uploadFilesForVehicles(res.vehicles, inv.vehicleList); return of(res); }),
          catchError(err => of({ error: true }))
        ));
      });
    });
    if (saveRequests.length === 0) return;
    Swal.fire({ title: 'Đang lưu...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    forkJoin(saveRequests).subscribe({
      next: () => { Swal.close(); this.resetAll(); Swal.fire('Thành công', 'Đã lưu hồ sơ', 'success'); },
      error: () => { Swal.close(); Swal.fire('Lỗi', 'Lưu hồ sơ thất bại', 'error'); }
    });
  }

  uploadFilesForVehicles(resVehicles: any[], localVehicles: VehicleData[]): void {
    resVehicles.forEach((vehicle, index) => {
      const original = localVehicles[index];
      if (original?.file && vehicle.id) this.documentService.upload([original.file], vehicle.id).subscribe();
    });
  }

  generateVehicleDescription(v: VehicleData, brand: string): void {
    v.vehicleDescription = `Xe ô tô chở người ${brand.toUpperCase()} ${v.modelName || ''} mới 100% xuất xứ ${v.origin || 'Việt Nam'}`;
  }
}
