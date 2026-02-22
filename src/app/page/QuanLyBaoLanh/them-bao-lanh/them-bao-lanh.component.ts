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
    private sanitizer: DomSanitizer
  ) { }

  /* ================= INIT ================= */

  ngOnInit(): void {
    this.initForm();
    this.initExportForm();
    this.loadBrands();
    this.loadCreditContracts();
    this.loadAuthorizedRepresentatives();
    this.bindSaleContractAmountChange();
    this.bindCreditContractChange();
    this.bindExportCalculation();
    this.initRepresentativeForm();
    this.loadCustomers();
    this.guaranteeForm.get('authorizedRepresentativeId')
      ?.valueChanges.subscribe(value => {

        if (value === 'NEW') {
          this.showAddRepresentativeForm = true;

          this.guaranteeForm.get('authorizedRepresentativeId')
            ?.valueChanges.subscribe(value => {

              this.showAddRepresentativeForm = value === 'NEW';

            });

        } else {
          this.showAddRepresentativeForm = false;
        }

      });
  }

  /* ================= FORM INIT ================= */

  initForm(): void {
    this.guaranteeForm = this.fb.group({
      customer: [null, Validators.required],
      authorizedRepresentativeId: [null],

      guaranteeContractNumber: ['', Validators.required],
      saleContract: ['', Validators.required],
      saleContractAmount: [null, [Validators.required, Validators.min(0)]],

      expectedGuaranteeAmount: [{ value: null, disabled: true }],
      expectedVehicleCount: [null, [Validators.required, Validators.min(1)]]
    });
    this.exportForm = this.fb.group({

      // ===== HẠN MỨC =====
      creditLimit: [{ value: 0, disabled: true }],
      usedLimit: [{ value: 0, disabled: true }],
      remainingLimit: [{ value: 0, disabled: true }],

      // ===== DƯ NỢ CHỈNH SỬA =====
      vehicleLoanBalance: [0, [Validators.required, Validators.min(0)]],
      guaranteeBalance: [0, [Validators.required, Validators.min(0)]],
      realEstateLoanBalance: [0, [Validators.required, Validators.min(0)]]

    });

    this.listenCalculateRemaining();
  }

  initExportForm(): void {
    this.exportForm = this.fb.group({

      // ===== HẠN MỨC =====
      creditLimit: [{ value: 0, disabled: true }],
      usedLimit: [{ value: 0, disabled: true }],
      remainingLimit: [{ value: 0, disabled: true }],

      // ===== DƯ NỢ =====
      guaranteeBalance: [{ value: 0, disabled: true }],
      vehicleLoanBalance: [{ value: 0, disabled: true }],
      realEstateLoanBalance: [{ value: 0, disabled: true }]

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
    this.creditContractService.getCreditContracts().subscribe(res => this.creditContracts = res);
  }
  loadCustomers(): void {
    this.customerService.getCustomers().subscribe(res => {
      this.customers = res;

      const defaultCustomer = this.customers.find(c => c.id === 2);

      if (defaultCustomer) {
        this.guaranteeForm.patchValue({
          customer: defaultCustomer   // ⭐ patch object
        });
      }
      console.log("Customers:", this.customers);
      console.log("Form value:", this.guaranteeForm.value);
    });
  }
  loadAuthorizedRepresentatives(selectId?: number) {

    this.authorizedRepresentativesService.getAuthorizedRepresentatives()
      .subscribe(list => {

        this.authorizedRepresentatives = list;

        if (selectId) {
          this.guaranteeForm.patchValue({
            authorizedRepresentativeId: selectId
          });
        }

      });
  }

  /* ================= LOGIC ================= */

  private applyBrandLogic(brand: Manufacturer): void {

    let hdmb = '';

    if (brand.code === 'HYUNDAI') {
      hdmb =
        'Hợp đồng nguyên tắc mua bán hàng hóa số 2504VS066/HĐNT/HTCVN ký ngày 01/04/2025 ' +
        'và Phụ lục hợp đồng số 250321/PLHD/VS066 ngày 20/03/2025';
    }

    if (brand.code === 'VINFAST') {
      hdmb =
        'Hợp đồng đại lý phân phối xe điện Vinfast số VFT-OT-20250105 ký ngày 10/03/2025';
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

      this.selectedCreditContract =
        this.creditContracts.find(c => c.id === Number(id));

      if (this.selectedCreditContract) {
        this.exportForm.patchValue({
          creditLimit: this.selectedCreditContract.creditLimit
        });
      }
    });
  }

  private bindSaleContractAmountChange(): void {

    this.guaranteeForm.get('saleContractAmount')
      ?.valueChanges.subscribe(value => {

        if (!value || !this.selectedBrand) {
          this.guaranteeForm.get('expectedGuaranteeAmount')
            ?.setValue(null, { emitEvent: false });
          return;
        }

        const expected =
          Number(value) * Number(this.selectedBrand.guaranteeRate);

        this.guaranteeForm.get('expectedGuaranteeAmount')
          ?.setValue(expected, { emitEvent: false });
      });
  }


  private bindExportCalculation(): void {

    this.exportForm.valueChanges.subscribe(v => {

      const used = Number(v.usedAmount || 0);
      const guarantee = Number(v.guaranteeBalance || 0);
      const shortLoan = Number(v.shortTermLoanBalance || 0);
      const creditLimit = Number(this.exportForm.get('creditLimit')?.value || 0);

      const total = used + guarantee + shortLoan;
      const remaining = creditLimit - total;

      this.exportForm.patchValue({
        totalGuaranteeAmount: total,
        remainingAmount: remaining
      }, { emitEvent: false });

    });
  }

  private calculateGuaranteeFee(): void {

    if (!this.currentGuarantee?.expectedGuaranteeAmount) return;

    const fee =
      this.currentGuarantee.expectedGuaranteeAmount * 0.02 * 29 / 365;

    this.exportForm.patchValue({
      guaranteeFee: Math.round(fee)
    });
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
      customerDTO: {
        id: v.customer.id
      },
      creditContractDTO: {
        id: v.creditContractId
      },

      manufacturerDTO: {
        id: this.selectedBrand.id,
        guaranteeRate: this.selectedBrand.guaranteeRate,
        templateCode: this.selectedBrand.templateCode
      },

      saleContract: v.saleContract,
      saleContractAmount: v.saleContractAmount,
      guaranteeContractNumber: v.guaranteeContractNumber,
      expectedVehicleCount: v.expectedVehicleCount,

      branchAuthorizedRepresentativeDTO: {
        id: v.authorizedRepresentativeId
      },

      expectedGuaranteeAmount: v.expectedGuaranteeAmount
    };

    console.log("Payload gửi BE:", payload);

    this.guaranteeService.createGuarantee(payload).subscribe({
      next: res => {
        this.currentGuarantee = res;
        const contractId = res.creditContractDTO?.id;

        this.selectedCreditContract = res.creditContractDTO;
        console.log("BE trả về:", res);
        // 🔥 Fill dữ liệu Step 3
        this.fillExportFormFromResponse();
        this.calculateGuaranteeFee();
        this.currentStep = 3;
      },
      error: err => {
        console.error("BE trả lỗi:", err);
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

  /* ================= BUILD EXPORT ================= */

  private buildGuaranteePayload(): GuaranteeLetter {

    const v = this.exportForm.getRawValue();

    return {
      ...this.currentGuarantee!,
      usedAmount: v.usedAmount,
      totalGuaranteeAmount: v.totalGuaranteeAmount,
      remainingAmount: v.remainingAmount
    };
  }

  private buildExportData(): XuatThuBaoLanh {

    const v = this.exportForm.getRawValue();

    return {
      usedAmount: v.usedAmount,
      guaranteeBalance: v.guaranteeBalance,
      shortTermLoanBalance: v.shortTermLoanBalance,
      totalGuaranteeAmount: v.totalGuaranteeAmount,
      remainingAmount: v.remainingAmount
    };
  }

  // ================= Thêm người đại diện ================= */
  addRepresentative() {

    if (this.representativeForm.invalid) {
      this.representativeForm.markAllAsTouched();
      return;
    }

    const payload = this.representativeForm.value;

    this.authorizedRepresentativesService.addRepresentative(payload)
      .subscribe({

        next: (res: any) => {

          alert('Thêm người đại diện thành công');

          this.showAddRepresentativeForm = false;

          // reload dropdown
          this.loadAuthorizedRepresentatives(res.id);

          this.representativeForm.reset();

        },

        error: () => {
          alert('Thêm thất bại');
        }

      });
  }
  cancelAddRepresentative() {
    this.showAddRepresentativeForm = false;
    this.representativeForm.reset();
  }
  /* ================= EXPORT ================= */
  xuatBoHoSoBaoLanh(): void {

    if (!this.currentGuarantee || !this.selectedBrand) return;

    if (this.exportForm.invalid) {
      this.exportForm.markAllAsTouched();
      return;
    }

    const templateCode = this.selectedBrand.templateCode;
    const contractNumber = this.currentGuarantee.guaranteeContractNumber;

    // ⭐ sanitize toàn bộ ký tự không hợp lệ
    const sanitizeName = (name: string) =>
      name.replace(/[<>:"/\\|?*]+/g, '_');

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

          zip.file(
            `${folderName}/${safeContract}_THU_BAO_LANH_${brand}.docx`,
            files.thuBaoLanh
          );

          zip.file(
            `${folderName}/${safeContract}_DE_XUAT_CAP_BAO_LANH_${brand}.docx`,
            files.deXuat
          );

          zip.file(
            `${folderName}/${safeContract}_PHAN_XET_DUYET_${brand}.docx`,
            files.xetDuyet
          );

          zip.file(
            `${folderName}/${safeContract}_PHAN_Y_KIEN_${brand}.docx`,
            files.yKien
          );

          const content = await zip.generateAsync({ type: 'blob' });

          saveAs(content, `${safeContract}.zip`);

        } catch (err) {
          console.error('Lỗi khi tạo file zip', err);
          alert('Xuất file thất bại');
        } finally {
          this.isExporting = false;
        }
      },

      error: (err) => {
        console.error('Lỗi khi gọi API export', err);
        alert('Không thể xuất hồ sơ. Vui lòng thử lại.');
        this.isExporting = false;
      }

    });
  }

  export(): void {

    if (!this.currentGuarantee || !this.selectedBrand) return;

    this.guaranteeLetterService
      .export(this.currentGuarantee, this.selectedBrand!.templateCode)
      .subscribe(blob => {

        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download =
          `${this.currentGuarantee?.guaranteeContractNumber}_THU_BAO_LANH_${this.selectedBrand?.code}.docx`;

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

    this.guaranteeLetterService
      .exportDeXuatCapBaoLanh(request, this.selectedBrand!.templateCode)
      .subscribe(blob => {

        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download =
          `${this.currentGuarantee?.guaranteeContractNumber}_DE_XUAT_CAP_BAO_LANH_${this.selectedBrand?.code}.docx`;

        a.click();
        URL.revokeObjectURL(url);
      });
  }

  exportPhanXetDuyet(): void {

    if (!this.currentGuarantee || this.exportForm.invalid) {
      this.exportForm.markAllAsTouched();
      return;
    }
    const request: ExportDeXuatRequest = {
      guaranteeLetter: this.buildGuaranteePayload(),
      exportData: this.buildExportData()
    };
    this.guaranteeLetterService
      .exportPhanXetDuyet(request, this.selectedBrand!.templateCode)
      .subscribe(blob => {

        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download =
          `${this.currentGuarantee?.guaranteeContractNumber}_PHAN_XET_DUYET_CUA_NGAN_HANG_${this.selectedBrand!.code}.docx`;

        a.click();
        URL.revokeObjectURL(url);
      });
  }

  exportPhanYKien(): void {

    if (!this.currentGuarantee || this.exportForm.invalid) {
      this.exportForm.markAllAsTouched();
      return;
    }

    this.guaranteeLetterService
      .exportPhanYKien(this.currentGuarantee, this.selectedBrand!.templateCode)
      .subscribe(blob => {

        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download =
          `${this.currentGuarantee?.guaranteeContractNumber}_PHAN_Y_KIEN_CUA_NGAN_HANG_${this.selectedBrand!.code}.docx`;

        a.click();
        URL.revokeObjectURL(url);
      });
  }
  // chuẩn hóa nhập tiền
  formatMoney(value: any): string {
    if (value === null || value === undefined) return '';
    return Number(value).toLocaleString('vi-VN');
  }

  parseMoney(value: string): number {
    return Number(value.replace(/\./g, ''));
  }
  onMoneyInput(
    event: any,
    controlName: string,
    maxValue?: number,
    form?: FormGroup
  ) {

    if (!form) return;

    let raw = event.target.value.replace(/\D/g, '');
    let numericValue = Number(raw);

    if (maxValue && numericValue > maxValue) {
      numericValue = maxValue;
    }

    form.get(controlName)?.setValue(numericValue); // 🔥 TRIGGER valueChanges

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


