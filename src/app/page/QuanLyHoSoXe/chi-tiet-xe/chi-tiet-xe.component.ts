import { Component } from '@angular/core';
import { VehicleDetail } from '../../../models/vehicle_detail.model';
import { ActivatedRoute, Router } from '@angular/router';
import { VehicleService } from '../../../service/vehicle.service';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { Vehicle } from '../../../models/vehicle';
import { Invoice } from '../../../models/invoice-data.model';
import { Guarantee } from '../../../models/guarantee.model';
import { GuaranteeLetter } from '../../../models/guarantee_letter';
import { DocumentVehicles } from '../../../models/document_vehicles';
import { DocumentService } from '../../../service/document.service';

@Component({
  selector: 'app-chi-tiet-xe',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './chi-tiet-xe.component.html',
  styleUrl: './chi-tiet-xe.component.css'
})
export class ChiTietXeComponent {
  detail?: Vehicle;
  isEdit = false;
  documents: DocumentVehicles[] = [];
  vehicleForm: FormGroup;

  invoiceOptions: Invoice[] = [];
  guaranteeOptions: GuaranteeLetter[] = [];

  filteredInvoices: Invoice[] = [];
  filteredGuarantees: GuaranteeLetter[] = [];
  selectedFiles: File[] = [];
  selectedInvoiceId?: number;
  selectedGuaranteeId?: number;

  showInvoiceDropdown = false;
  showGuaranteeDropdown = false;

  constructor(
    private route: ActivatedRoute,
    private vehicleService: VehicleService,
    private documentService: DocumentService,
    private router: Router,
    private fb: FormBuilder
  ) {

    /* ===== FORM ===== */
    this.vehicleForm = this.fb.group({

      vehicleName: ['', Validators.required],
      status: ['', Validators.required],
      chassisNumber: ['', Validators.required],
      engineNumber: ['', Validators.required],
      color: [''],
      seats: [5],
      price: [0],

      importDate: [''],
      docsDeliveryDate: [''],
      description: [''],

      /* UI ONLY */
      invoiceNumber: [''],
      guaranteeNoticeNumber: [''],
      createAt: ['']
    });
  }

  /* ================= INIT ================= */

  ngOnInit(): void {

    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (id) this.loadDetail(id);

    this.loadInvoices();
    this.loadGuarantees();
  }

  /* ================= LOAD DETAIL ================= */

  loadDetail(id: number) {

    this.vehicleService.getVehicleDetail(id).subscribe(res => {

      this.detail = res;

      this.vehicleForm.patchValue({
        vehicleName: res.vehicleName,
        status: res.status,
        chassisNumber: res.chassisNumber,
        engineNumber: res.engineNumber,
        color: res.color,
        seats: res.seats,
        price: res.price,
        importDate: res.importDate,
        docsDeliveryDate: res.docsDeliveryDate,
        description: res.description,
        guaranteeNoticeNumber:
          res.guaranteeLetterDTO?.guaranteeNoticeNumber || ''
      });

      /* ===== INVOICE ===== */

      if (res.invoiceId) {
        this.vehicleForm.patchValue({
          invoiceNumber: res.invoiceId.invoiceNumber
        });

        this.selectedInvoiceId = res.invoiceId.id;
      }

      /* ===== GUARANTEE ===== */

      if (res.guaranteeLetterDTO) {
        this.vehicleForm.patchValue({
          guaranteeNoticeNumber: res.guaranteeLetterDTO.guaranteeNoticeNumber
        });

        this.selectedGuaranteeId = res.guaranteeLetterDTO.id;
      }
      /* ===== DOCUMENTS ===== */
      this.documents = res.documents || [];
    });
    console.log("Thông tin xe:", this.detail);
  }

  /* ================= LOAD OPTIONS ================= */

  loadInvoices() {

    this.vehicleService.getAllInvoices().subscribe(res => {
      this.invoiceOptions = res;
      this.filteredInvoices = res;
    });
  }

  loadGuarantees() {

    this.vehicleService.getAllGuarantees().subscribe(res => {

      this.guaranteeOptions = res.filter(g =>
        g.guaranteeNoticeNumber?.trim()
      );

      this.filteredGuarantees = this.guaranteeOptions;
    });
  }
  /* ================= FILE ================= */
  getFileIcon(type?: string): string {

    if (!type) return 'fa-file';

    const t = type.toLowerCase();

    if (t.includes('pdf')) return 'fa-file-pdf';
    if (t.includes('doc')) return 'fa-file-word';
    if (['jpg', 'jpeg', 'png'].some(x => t.includes(x))) return 'fa-file-image';

    return 'fa-file';
  }

  previewVehicleFile(doc: DocumentVehicles) {

    this.documentService.previewFile(doc.id!).subscribe(blob => {

      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');

    });

  }
  downloadVehicleFile(doc: DocumentVehicles) {

    this.documentService.downloadFile(doc.id!).subscribe(blob => {

      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = doc.fileName;
      a.click();

      window.URL.revokeObjectURL(url);

    });

  }
  deleteVehicleFile(doc: DocumentVehicles) {

    Swal.fire({
      title: 'Xóa file?',
      icon: 'warning',
      showCancelButton: true
    }).then(res => {

      if (!res.isConfirmed) return;

      this.documentService.deleteFile(doc.id!).subscribe({
        next: () => {

          this.documents = this.documents.filter(d => d.id !== doc.id);

          Swal.fire('Đã xóa file', '', 'success');
        },

        error: err => {
          console.error('Delete file error', err);

          Swal.fire('Lỗi', 'Xóa file thất bại', 'error');
        }
      });

    });

  }

  onSelectFiles(event: any) {
    this.selectedFiles = Array.from(event.target.files);
  }
  uploadVehicleFiles(vehicleId: number) {

    if (!this.selectedFiles.length) return;

    this.documentService.uploadFiles(this.selectedFiles, vehicleId)
      .subscribe(res => {

        this.documents.push(...res);

        this.selectedFiles = [];

        Swal.fire('Upload thành công', '', 'success');

      });

  }

  /* ================= INVOICE ================= */

  onInvoiceFocus() {
    this.showInvoiceDropdown = true;
    this.filteredInvoices = this.invoiceOptions;
  }

  onInvoiceInput(event: Event) {

    const value = (event.target as HTMLInputElement).value.toLowerCase();

    this.selectedInvoiceId = undefined;

    this.filteredInvoices = this.invoiceOptions.filter(i =>
      i.invoiceNumber.toLowerCase().includes(value)
    );
  }

  onInvoiceBlur() {
    setTimeout(() => this.showInvoiceDropdown = false, 200);
  }

  selectInvoice(i: Invoice) {

    this.vehicleForm.patchValue({
      invoiceNumber: i.invoiceNumber
    });

    this.selectedInvoiceId = i.id;
    this.showInvoiceDropdown = false;
  }

  /* ================= GUARANTEE ================= */

  onGuaranteeFocus() {
    this.showGuaranteeDropdown = true;
    this.filteredGuarantees = this.guaranteeOptions;
  }

  onGuaranteeInput(event: Event) {

    const keyword = (event.target as HTMLInputElement).value.toLowerCase();

    this.selectedGuaranteeId = undefined;

    this.filteredGuarantees = this.guaranteeOptions.filter(g => {
      this.filteredGuarantees = this.guaranteeOptions.filter(g =>
        g.guaranteeNoticeNumber?.toLowerCase().includes(keyword)
      );
      return (
        g.guaranteeNoticeNumber?.toLowerCase().includes(keyword) ||
        g.referenceCode?.toLowerCase().includes(keyword) ||
        g.guaranteeContractNumber?.toLowerCase().includes(keyword)
      );
    });
  }

  onGuaranteeBlur() {
    setTimeout(() => this.showGuaranteeDropdown = false, 200);
  }

  selectGuarantee(g: GuaranteeLetter) {

    this.vehicleForm.patchValue({
      guaranteeNoticeNumber: g.guaranteeNoticeNumber
    });

    this.selectedGuaranteeId = g.id;
    this.showGuaranteeDropdown = false;
  }

  /* ================= SAVE ================= */

  save(): void {

    if (!this.detail?.id) return;

    if (this.vehicleForm.invalid) {
      Swal.fire('Lỗi', 'Kiểm tra lại dữ liệu', 'error');
      return;
    }

    /* ===== VALIDATE DROPDOWN ===== */

    if (this.vehicleForm.value.invoiceNumber && !this.selectedInvoiceId) {
      Swal.fire('Lỗi', 'Vui lòng chọn hóa đơn hợp lệ', 'warning');
      return;
    }

    if (this.vehicleForm.value.guaranteeNoticeNumber && !this.selectedGuaranteeId) {
      Swal.fire('Lỗi', 'Vui lòng chọn thư bảo lãnh hợp lệ', 'warning');
      return;
    }

    /* ===== BUILD PAYLOAD ===== */

    const payload: any = {

      vehicleName: this.vehicleForm.value.vehicleName,
      status: this.vehicleForm.value.status,
      chassisNumber: this.vehicleForm.value.chassisNumber,
      engineNumber: this.vehicleForm.value.engineNumber,
      color: this.vehicleForm.value.color,
      seats: this.vehicleForm.value.seats,
      price: this.vehicleForm.value.price,
      importDate: this.vehicleForm.value.importDate,
      docsDeliveryDate: this.vehicleForm.value.docsDeliveryDate,
      description: this.vehicleForm.value.description,

      invoiceId: this.selectedInvoiceId
        ? { id: this.selectedInvoiceId }
        : null,

      guaranteeLetterDTO: this.selectedGuaranteeId
        ? { id: this.selectedGuaranteeId }
        : null
    };

    this.vehicleService.updateVehicle(this.detail.id, payload)
      .subscribe(() => {

        Swal.fire('Thành công', 'Đã cập nhật xe', 'success');

        this.isEdit = false;
        this.loadDetail(this.detail!.id!);
      });
  }

  /* ================= UI ================= */

  toggleEdit() {
    this.isEdit = !this.isEdit;
    if (this.isEdit && this.detail) {
      this.vehicleForm.patchValue({
        guaranteeNoticeNumber:
          this.detail.guaranteeLetterDTO?.guaranteeNoticeNumber || ''
      });
    }
  }

  goBack() {
    this.router.navigate(['manager/danh-sach-ho-so-xe']);
  }
}
