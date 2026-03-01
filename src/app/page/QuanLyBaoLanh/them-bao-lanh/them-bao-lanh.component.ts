import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { Manufacturer } from '../../../models/manufacturer';
import { CreditContract } from '../../../models/credit_contract';
import { BranchAuthorizedRepresentative } from '../../../models/branch-authorized-representative';
import { GuaranteeLetter } from '../../../models/guarantee_letter';
import { XuatThuBaoLanh } from '../../../models/xuat-thu-bao-lanh';
import { ExportDeXuatRequest } from '../../../models/export_de_xuat_request';
import { Customer } from '../../../models/customer.model';
import { CustomerService } from '../../../service/customer.service';
import { ManufacturerService } from '../../../service/manufacturer.service';
import { CreditContractService } from '../../../service/credit_contract.service';
import { AuthorizedRepresentativesService } from '../../../service/authorized-representatives.service';
import { GuaranteeService } from '../../../service/guarantee.service';
import { GuaranteeLetterService } from '../../../service/guarantee-letter.service';
import JSZip from 'jszip';
import { forkJoin } from 'rxjs';
import { saveAs } from 'file-saver';
import { ActivatedRoute } from '@angular/router';
import { OfficerGuaranteeService } from '../../../service/officer-guarantee.service';

@Component({
  selector: 'app-them-bao-lanh',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './them-bao-lanh.component.html',
  styleUrl: './them-bao-lanh.component.css'
})
export class ThemBaoLanhComponent implements OnInit {

  /* ================= STEP ================= */
  currentStep = 1;

  /* ================= FORM ================= */
  guaranteeForm!: FormGroup;
  exportForm!: FormGroup;
  showAddRepresentativeForm = false;

  representativeForm!: FormGroup;
  /* ================= DATA ================= */
  brands: Manufacturer[] = [];
  selectedBrand: Manufacturer | null = null;

  creditContracts: CreditContract[] = [];
  selectedCreditContract?: CreditContract;
  filteredCreditContracts: CreditContract[] = [];

  authorizedRepresentatives: BranchAuthorizedRepresentative[] = [];
  customers: Customer[] = [];
  currentGuarantee?: GuaranteeLetter;
  previewUrl?: SafeResourceUrl;
  isExporting = false;
  constructor(
    private fb: FormBuilder,
    private manufacturerService: ManufacturerService,
    private creditContractService: CreditContractService,
    private authorizedRepresentativesService: AuthorizedRepresentativesService,
    private guaranteeService: GuaranteeService,
    private guaranteeLetterService: GuaranteeLetterService,
    private customerService: CustomerService,
    private officerGuaranteeService: OfficerGuaranteeService,
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer
  ) { }

  /* ================= INIT ================= */

  ngOnInit(): void {
    this.initForm();
    this.initExportForm();
    this.initRepresentativeForm();

    this.bindSaleContractAmountChange();
    this.bindCreditContractChange();
    this.bindCustomerChange();
    this.bindExportCalculation();
    this.listenCalculateRemaining();

    // Đợi tất cả danh mục load xong mới tiến hành checkApplicationId
    forkJoin({
      brands: this.manufacturerService.getManufacture(),
      customers: this.customerService.getCustomers(),
      creditContracts: this.creditContractService.getCreditContracts(),
      reps: this.authorizedRepresentativesService.getAuthorizedRepresentatives()
    }).subscribe({
      next: (res) => {
        this.brands = res.brands;
        this.customers = res.customers;
        this.creditContracts = res.creditContracts;
        this.authorizedRepresentatives = res.reps;

        // Bây giờ các danh sách đã có dữ liệu, việc find() trong checkApplicationId sẽ thành công
        this.checkApplicationId();
      },
      error: (err) => console.error("Error loading master data:", err)
    });

    this.guaranteeForm.get('authorizedRepresentativeId')?.valueChanges.subscribe(value => {
      this.showAddRepresentativeForm = value === 'NEW';
    });
  }

  /* ================= FORM INIT ================= */

  initForm(): void {
    this.guaranteeForm = this.fb.group({
      customer: [null, Validators.required],
      creditContractId: [null, Validators.required],
      authorizedRepresentativeId: [null, Validators.required],

      guaranteeContractNumber: ['', Validators.required],
      saleContract: ['', Validators.required],
      saleContractAmount: [null, [Validators.required, Validators.min(1)]],

      expectedGuaranteeAmount: [{ value: null, disabled: true }],
      expectedVehicleCount: [null, [Validators.required, Validators.min(1)]]
    });
  }

  initExportForm(): void {
    this.exportForm = this.fb.group({
      creditLimit: [{ value: 0, disabled: true }],
      usedLimit: [{ value: 0, disabled: true }],
      remainingLimit: [{ value: 0, disabled: true }],
      guaranteeBalance: [0, [Validators.required, Validators.min(0)]],
      vehicleLoanBalance: [0, [Validators.required, Validators.min(0)]],
      realEstateLoanBalance: [0, [Validators.required, Validators.min(0)]],
      guaranteeFee: [0]
    });
  }

  initRepresentativeForm() {
    this.representativeForm = this.fb.group({
      branchCode: ['BIDV_DT', Validators.required],
      branchName: ['Ngân hàng TMCP Đầu tư và Phát triển Việt Nam - Chi nhánh Đồng Tháp', Validators.required],
      representativeName: ['', Validators.required],
      representativeTitle: ['', Validators.required],
      authorizationDocNo: ['', Validators.required],
      authorizationDocDate: ['', Validators.required],
      authorizationIssuer: ['Giám đốc Ngân hàng TMCP Đầu tư và Phát triển Việt Nam - Chi nhánh Đồng Tháp', Validators.required],
      effectiveFrom: ['', Validators.required]
    });
  }

  /* ================= LOAD DATA ================= */

  loadBrands(): void {
    this.manufacturerService.getManufacture().subscribe(res => this.brands = res);
  }

  loadCreditContracts(): void {
    this.creditContractService.getCreditContracts().subscribe(res => {
      this.creditContracts = res;
    });
  }

  loadCustomers(): void {
    this.customerService.getCustomers().subscribe(res => {
      this.customers = res;
      console.log("Customers loaded:", this.customers);
    });
  }

  loadAuthorizedRepresentatives(selectId?: number) {
    this.authorizedRepresentativesService.getAuthorizedRepresentatives().subscribe(list => {
      this.authorizedRepresentatives = list;
      if (selectId) {
        this.guaranteeForm.patchValue({ authorizedRepresentativeId: selectId });
      }
    });
  }

  /* ================= CHECK APPLICATION ID ================= */
  private checkApplicationId(): void {
    this.route.queryParams.subscribe(params => {
      const appId = params['applicationId'];
      if (appId) {
        this.officerGuaranteeService.getApplicationById(Number(appId)).subscribe({
          next: (app: any) => { // Use any or cast to GuaranteeApplication
            console.log("Populating application data:", app);

            if (app.manufacturerDTO) {
              const brand = this.brands.find(b => b.id === app.manufacturerDTO?.id);
              if (brand) this.selectBrand(brand);
            }

            if (app.customerDTO) {
              const customer = this.customers.find(c => c.id === app.customerDTO?.id);
              if (customer) {
                this.guaranteeForm.patchValue({ customer: customer });
                this.filterCreditContracts(customer.id!);
              }
            }

            if (app.branchAuthorizedRepresentativeDTO) {
              const rep = this.authorizedRepresentatives.find(r => r.id === app.branchAuthorizedRepresentativeDTO?.id);
              if (rep) {
                this.guaranteeForm.patchValue({ authorizedRepresentativeId: rep.id });
              }
            } else if (this.authorizedRepresentatives.length > 0) {
              // Nếu hồ sơ chưa có người đại diện, tự động chọn người đầu tiên làm gợi ý
              this.guaranteeForm.patchValue({ authorizedRepresentativeId: this.authorizedRepresentatives[0].id });
            }

            // Điền các thông tin khác, ưu tiên dữ liệu từ app nếu có
            this.guaranteeForm.patchValue({
              expectedVehicleCount: app.totalVehicleCount || 1,
              expectedGuaranteeAmount: app.totalGuaranteeAmount || 0,
              saleContractAmount: app.totalVehicleAmount || 0,
              guaranteeContractNumber: app.subGuaranteeContractNumber || app.applicationNumber || `BL/2025/${app.id || 'NEW'}/${Math.floor(Math.random() * 1000)}`
            });

            // Nếu app có saleContract thì mới ghi đè, nếu không thì giữ nguyên mẫu đã set ở applyBrandLogic
            if (app.saleContract) {
              this.guaranteeForm.patchValue({ saleContract: app.saleContract });
            }

            this.currentStep = 2;
          },
          error: (err) => console.error('Error loading application:', err)
        });
      }
    });
  }

  filterCreditContracts(customerId: number): void {
    this.filteredCreditContracts = this.creditContracts.filter(c => c.customerId === customerId);
    if (this.filteredCreditContracts.length === 1) {
      this.guaranteeForm.patchValue({ creditContractId: this.filteredCreditContracts[0].id });
    }
  }

  /* ================= LOGIC ================= */

  bindCustomerChange(): void {
    this.guaranteeForm.get('customer')?.valueChanges.subscribe(customer => {
      if (customer && customer.id) {
        this.filterCreditContracts(customer.id);
      } else {
        this.filteredCreditContracts = [];
        this.guaranteeForm.patchValue({ creditContractId: null });
      }
    });
  }

  private applyBrandLogic(brand: Manufacturer): void {
    let hdmb = '';
    if (brand.code === 'HYUNDAI') {
      hdmb = 'Hợp đồng nguyên tắc mua bán hàng hóa số 2504VS066/HĐNT/HTCVN ký ngày 01/04/2025 và Phụ lục hợp đồng số 250321/PLHD/VS066 ngày 20/03/2025';
    } else if (brand.code === 'VINFAST') {
      hdmb = 'Hợp đồng đại lý phân phối xe điện Vinfast số VFT-OT-20250105 ký ngày 10/03/2025';
    }

    this.guaranteeForm.patchValue({
      saleContract: hdmb,
      expectedGuaranteeAmount: null
    });
  }

  selectBrand(brand: Manufacturer): void {
    this.selectedBrand = brand;
    this.applyBrandLogic(brand);
  }

  private bindCreditContractChange(): void {
    this.guaranteeForm.get('creditContractId')?.valueChanges.subscribe(id => {
      this.selectedCreditContract = this.creditContracts.find(c => c.id === Number(id));
      if (this.selectedCreditContract) {
        this.exportForm.patchValue({
          creditLimit: this.selectedCreditContract.creditLimit
        });
      }
    });
  }

  private bindSaleContractAmountChange(): void {
    this.guaranteeForm.get('saleContractAmount')?.valueChanges.subscribe(value => {
      if (!value || !this.selectedBrand) {
        this.guaranteeForm.get('expectedGuaranteeAmount')?.setValue(null, { emitEvent: false });
        return;
      }
      const expected = Number(value) * Number(this.selectedBrand.guaranteeRate);
      this.guaranteeForm.get('expectedGuaranteeAmount')?.setValue(expected, { emitEvent: false });
    });
  }

  private bindExportCalculation(): void {
    // Already handled by listenCalculateRemaining mostly
  }

  private calculateGuaranteeFee(): void {
    if (!this.currentGuarantee?.expectedGuaranteeAmount) return;
    const fee = this.currentGuarantee.expectedGuaranteeAmount * 0.02 * 29 / 365;
    this.exportForm.patchValue({ guaranteeFee: Math.round(fee) });
  }

  /* ================= STEP ================= */

  goToGuaranteeForm(): void {
    if (!this.selectedBrand) return;
    this.currentStep = 2;
  }

  backToBrand(): void {
    this.currentStep = 1;
  }

  ThemBaoLanhMoi(): void {
    this.currentStep = 1;
    this.selectedBrand = null;
    this.guaranteeForm.reset();
    this.exportForm.reset();
  }

  /* ================= SUBMIT ================= */

  submitGuarantee(): void {
    if (this.guaranteeForm.invalid || !this.selectedBrand) {
      this.guaranteeForm.markAllAsTouched();
      return;
    }
    const v = this.guaranteeForm.getRawValue();
    if (v.authorizedRepresentativeId === 'NEW') {
      alert("Vui lòng lưu người đại diện trước");
      return;
    }

    const payload: GuaranteeLetter = {
      customerDTO: { id: v.customer.id } as any,
      manufacturerDTO: { id: this.selectedBrand.id } as any,
      branchAuthorizedRepresentativeDTO: { id: v.authorizedRepresentativeId } as any,
      guaranteeApplicationDTO: {
        id: Number(this.route.snapshot.queryParams['applicationId']) || null
      } as any,
      expectedGuaranteeAmount: v.expectedGuaranteeAmount,
      guaranteeContractNumber: v.guaranteeContractNumber,
      saleContract: v.saleContract,
      saleContractAmount: v.saleContractAmount,
      expectedVehicleCount: v.expectedVehicleCount,
      // Các trường khác như referenceCode, guaranteeNoticeNumber có thể thêm nếu form có
    };

    this.guaranteeService.createGuarantee(payload).subscribe({
      next: res => {
        this.currentGuarantee = res;
        this.selectedCreditContract = res.creditContractDTO;
        this.fillExportFormFromResponse();
        this.calculateGuaranteeFee();
        this.currentStep = 3;

        // Cập nhật trạng thái đơn hàng (Application) sang APPROVED nếu có applicationId
        const appId = this.route.snapshot.queryParams['applicationId'];
        if (appId) {
          this.officerGuaranteeService.approveApplication(Number(appId)).subscribe({
            next: () => console.log(`Application ${appId} approved successfully`),
            error: (err) => console.error(`Failed to approve application ${appId}`, err)
          });
        }
      },
      error: err => {
        console.error("Error creating guarantee:", err);
        const msg = err.error?.message || "Có lỗi xảy ra khi lưu bảo lãnh (Bad Request)";
        alert("Lỗi: " + msg);
      }
    });
  }

  private fillExportFormFromResponse(): void {
    const contract = this.selectedCreditContract;
    if (!contract) return;

    this.exportForm.patchValue({
      creditLimit: contract.creditLimit ?? 0,
      usedLimit: contract.usedLimit ?? 0,
      remainingLimit: contract.remainingLimit ?? 0,
      guaranteeBalance: contract.guaranteeBalance ?? 0,
      vehicleLoanBalance: contract.vehicleLoanBalance ?? 0,
      realEstateLoanBalance: contract.realEstateLoanBalance ?? 0
    }, { emitEvent: false });
  }

  /* ================= EXPORT ================= */

  private buildGuaranteePayload(): GuaranteeLetter {
    const v = this.exportForm.getRawValue();
    return {
      ...this.currentGuarantee!,
      usedAmount: v.usedLimit,
      totalGuaranteeAmount: v.creditLimit - v.remainingLimit, // Or whatever logic
      remainingAmount: v.remainingLimit
    };
  }

  private buildExportData(): XuatThuBaoLanh {
    const v = this.exportForm.getRawValue();
    return {
      usedAmount: v.usedLimit,
      guaranteeBalance: v.guaranteeBalance,
      shortTermLoanBalance: v.vehicleLoanBalance, // Map fields accordingly
      totalGuaranteeAmount: v.usedLimit,
      remainingAmount: v.remainingLimit
    };
  }

  addRepresentative() {
    if (this.representativeForm.invalid) {
      this.representativeForm.markAllAsTouched();
      return;
    }
    this.authorizedRepresentativesService.addRepresentative(this.representativeForm.value).subscribe({
      next: (res: any) => {
        alert('Thêm người đại diện thành công');
        this.showAddRepresentativeForm = false;
        this.loadAuthorizedRepresentatives(res.id);
        this.representativeForm.reset();
      },
      error: () => alert('Thêm thất bại')
    });
  }

  cancelAddRepresentative() {
    this.showAddRepresentativeForm = false;
    this.representativeForm.reset();
  }

  xuatBoHoSoBaoLanh(): void {
    if (!this.currentGuarantee || !this.selectedBrand) return;
    if (this.exportForm.invalid) {
      this.exportForm.markAllAsTouched();
      return;
    }

    const templateCode = this.selectedBrand.templateCode;
    const contractNumber = this.currentGuarantee.guaranteeContractNumber;
    const sanitizeName = (name: string) => name.replace(/[<>:"/\\|?*]+/g, '_');
    const safeContract = sanitizeName(contractNumber || '');
    const brand = sanitizeName(this.selectedBrand.code || '');
    const folderName = `${safeContract}_${brand}`;

    const request: ExportDeXuatRequest = {
      guaranteeLetter: this.buildGuaranteePayload(),
      exportData: this.buildExportData()
    };

    this.isExporting = true;
    forkJoin({
      thuBaoLanh: this.guaranteeLetterService.export(this.currentGuarantee, templateCode),
      deXuat: this.guaranteeLetterService.exportDeXuatCapBaoLanh(request, templateCode),
      xetDuyet: this.guaranteeLetterService.exportPhanXetDuyet(request, templateCode),
      yKien: this.guaranteeLetterService.exportPhanYKien(this.currentGuarantee, templateCode)
    }).subscribe({
      next: async (files) => {
        try {
          const zip = new JSZip();
          zip.file(`${folderName}/${safeContract}_THU_BAO_LANH_${brand}.docx`, files.thuBaoLanh);
          zip.file(`${folderName}/${safeContract}_DE_XUAT_CAP_BAO_LANH_${brand}.docx`, files.deXuat);
          zip.file(`${folderName}/${safeContract}_PHAN_XET_DUYET_${brand}.docx`, files.xetDuyet);
          zip.file(`${folderName}/${safeContract}_PHAN_Y_KIEN_${brand}.docx`, files.yKien);
          const content = await zip.generateAsync({ type: 'blob' });
          saveAs(content, `${safeContract}.zip`);
        } catch (err) {
          console.error('Error zipping files', err);
          alert('Xuất file thất bại');
        } finally {
          this.isExporting = false;
        }
      },
      error: (err) => {
        console.error('Export API error', err);
        alert('Không thể xuất hồ sơ');
        this.isExporting = false;
      }
    });
  }

  export(): void {
    if (!this.currentGuarantee || !this.selectedBrand) return;
    this.guaranteeLetterService.export(this.currentGuarantee, this.selectedBrand!.templateCode).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.currentGuarantee?.guaranteeContractNumber}_THU_BAO_LANH_${this.selectedBrand?.code}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  exportDeXuatCapBaoLanh(): void {
    if (!this.currentGuarantee || this.exportForm.invalid || !this.selectedBrand) {
      this.exportForm.markAllAsTouched();
      return;
    }
    const request: ExportDeXuatRequest = {
      guaranteeLetter: this.buildGuaranteePayload(),
      exportData: this.buildExportData()
    };
    this.guaranteeLetterService.exportDeXuatCapBaoLanh(request, this.selectedBrand!.templateCode).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.currentGuarantee?.guaranteeContractNumber}_DE_XUAT_CAP_BAO_LANH_${this.selectedBrand?.code}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  exportPhanXetDuyet(): void {
    if (!this.currentGuarantee || !this.selectedBrand || this.exportForm.invalid) {
      this.exportForm.markAllAsTouched();
      return;
    }
    const request: ExportDeXuatRequest = {
      guaranteeLetter: this.buildGuaranteePayload(),
      exportData: this.buildExportData()
    };
    this.guaranteeLetterService.exportPhanXetDuyet(request, this.selectedBrand!.templateCode).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.currentGuarantee?.guaranteeContractNumber}_PHAN_XET_DUYET_${this.selectedBrand?.code}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  exportPhanYKien(): void {
    if (!this.currentGuarantee || !this.selectedBrand) return;
    this.guaranteeLetterService.exportPhanYKien(this.currentGuarantee, this.selectedBrand!.templateCode).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.currentGuarantee?.guaranteeContractNumber}_PHAN_Y_KIEN_${this.selectedBrand?.code}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  /* ================= HELPERS ================= */

  formatMoney(value: any): string {
    if (value === null || value === undefined) return '';
    return Number(value).toLocaleString('vi-VN');
  }

  onMoneyInput(event: any, controlName: string, maxValue?: number, form: FormGroup = this.exportForm) {
    let raw = event.target.value.replace(/\D/g, '');
    let numericValue = Number(raw);
    if (maxValue && numericValue > maxValue) numericValue = maxValue;
    form.get(controlName)?.setValue(numericValue);
    event.target.value = this.formatMoney(numericValue);
  }

  private listenCalculateRemaining() {
    this.exportForm.valueChanges.subscribe(val => {
      const creditLimit = val.creditLimit ?? 0;
      const vehicle = val.vehicleLoanBalance ?? 0;
      const guarantee = val.guaranteeBalance ?? 0;
      const realEstate = val.realEstateLoanBalance ?? 0;

      const used = vehicle + guarantee + realEstate;
      const remaining = creditLimit - used;

      this.exportForm.patchValue({
        usedLimit: used,
        remainingLimit: remaining < 0 ? 0 : remaining
      }, { emitEvent: false });
    });
  }
}
