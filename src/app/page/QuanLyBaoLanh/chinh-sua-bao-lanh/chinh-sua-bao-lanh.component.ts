import { Component } from '@angular/core';
import { GuaranteeLetterService } from '../../../service/guarantee-letter.service';
import { ActivatedRoute, Router } from '@angular/router';
import { GuaranteeLetter } from '../../../models/guarantee_letter';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ManufacturerService } from '../../../service/manufacturer.service';
import { Manufacturer } from '../../../models/manufacturer';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-chinh-sua-bao-lanh',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './chinh-sua-bao-lanh.component.html',
  styleUrl: './chinh-sua-bao-lanh.component.css'
})
export class ChinhSuaBaoLanhComponent {
  selectedFile: File | null = null;
  editForm!: FormGroup;
  originalData!: GuaranteeLetter;
  brands: Manufacturer[] = [];

  uploading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private guaranteeService: GuaranteeLetterService,
    private manufacturerService: ManufacturerService,

  ) { }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.loadBrands();

    this.guaranteeService.getById(id).subscribe(data => {
      this.originalData = data;
      this.buildForm(data);
    });
  }

  loadBrands(): void {
    this.manufacturerService.getManufacture().subscribe({
      next: (res: Manufacturer[]) => this.brands = res,
      error: () => console.error('Không tải được hãng xe')
    });
  }

  buildForm(data: GuaranteeLetter): void {
    this.editForm = this.fb.group({
      guaranteeNoticeNumber: [data.guaranteeNoticeNumber],
      guaranteeNoticeDate: [{ value: data.guaranteeNoticeDate }],
      guaranteeContractNumber: [{ value: data.guaranteeContractNumber, disabled: true }],
      guaranteeContractDate: [{ value: data.guaranteeContractDate, disabled: true }],

      referenceCode: [data.referenceCode],
      manufacturerId: [data.manufacturerDTO?.id, Validators.required],
      manufacturerCode: [data.manufacturerDTO?.code, Validators.required],

      expectedGuaranteeAmount: [data.expectedGuaranteeAmount, Validators.required],
      totalGuaranteeAmount: [{ value: data.totalGuaranteeAmount, disabled: true }],
      usedAmount: [{ value: data.usedAmount, disabled: true }],
      remainingAmount: [{ value: data.remainingAmount, disabled: true }],

      expectedVehicleCount: [data.expectedVehicleCount, Validators.required],
      importedVehicleCount: [{ value: data.importedVehicleCount, disabled: true }],
      exportedVehicleCount: [{ value: data.exportedVehicleCount, disabled: true }],

      saleContract: [{ value: data.saleContract, disabled: true }],
      saleContractAmount: [{ value: data.saleContractAmount, disabled: true }],

      branchName: [{ value: data.branchAuthorizedRepresentativeDTO?.branchName, disabled: true }],
      representativeName: [{ value: data.branchAuthorizedRepresentativeDTO?.representativeName, disabled: true }],

      branchAuthorizedRepresentativeId: [
        data.branchAuthorizedRepresentativeDTO?.id
      ]
    });
  }

  /* ================== UPLOAD FILE ================== */
  onSelectFile(event: any) {

    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      Swal.fire('Sai định dạng', 'Chỉ cho phép PDF', 'warning');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      Swal.fire('File quá lớn', 'Tối đa 5MB', 'warning');
      return;
    }

    this.selectedFile = file;
  }
  onUploadFile(event: any) {

    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      Swal.fire('Sai định dạng', 'Chỉ cho phép PDF', 'warning');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      Swal.fire('File quá lớn', 'Tối đa 5MB', 'warning');
      return;
    }

    if (this.originalData.fileId) {
      Swal.fire({
        title: 'File đã tồn tại',
        text: 'Bạn có muốn thay thế file?',
        icon: 'question',
        showCancelButton: true
      }).then(result => {
        if (result.isConfirmed) {
          this.uploadFile(file);
        }
      });
    } else {
      this.uploadFile(file);
    }
  }
  confirmUpload() {

    if (!this.selectedFile) return;

    if (this.originalData.fileId) {
      Swal.fire({
        title: 'File đã tồn tại',
        text: 'Bạn có muốn thay thế file?',
        icon: 'question',
        showCancelButton: true
      }).then(result => {
        if (result.isConfirmed) {
          this.uploadFile(this.selectedFile!);
        }
      });
    } else {
      this.uploadFile(this.selectedFile);
    }
  }
  uploadFile(file: File) {

    this.uploading = true;

    this.guaranteeService.uploadFile(this.originalData.id!, file).subscribe({
      next: res => {

        this.originalData.fileId = res;
        this.selectedFile = null;
        this.uploading = false;

        Swal.fire('Thành công', 'Upload file thành công', 'success');
      },
      error: () => {
        this.uploading = false;
        Swal.fire('Lỗi', 'Upload thất bại', 'error');
      }
    });
  }

  /* ================== DOWNLOAD FILE ================== */
  downloadFile() {

    const file = this.originalData.fileId;
    if (!file) return;

    this.guaranteeService.downloadFile(file.id ?? 0).subscribe(blob => {

      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = file.fileName;
      a.click();

      window.URL.revokeObjectURL(url);
    });
  }
  onPreviewFile(): void {

    const file = this.originalData?.fileId;

    if (!file?.id) return;

    this.guaranteeService.previewPdf(file.id).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
      },
      error: (err) => {
        console.error('Preview file error', err);
      }
    });

  }
  onDeleteFile(): void {

    const file = this.originalData?.fileId;

    if (!file?.id) return;

    Swal.fire({
      title: 'Xóa file?',
      text: 'Bạn có chắc muốn xóa file thư bảo lãnh này không?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      reverseButtons: true
    }).then((result) => {

      if (!result.isConfirmed) return;

      this.guaranteeService.deleteFile(file.id!).subscribe({
        next: () => {

          // clear UI
          this.originalData.fileId = undefined;

          Swal.fire({
            icon: 'success',
            title: 'Đã xóa',
            text: 'File đã được xóa thành công',
            timer: 1500,
            showConfirmButton: false
          });

        },
        error: (err) => {

          console.error('Delete file error', err);

          Swal.fire({
            icon: 'error',
            title: 'Lỗi',
            text: 'Xóa file thất bại'
          });
        }
      });

    });
  }
  submit(): void {

    if (this.editForm.invalid) return;

    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      Swal.fire('Lỗi', 'Không xác định được ID thư bảo lãnh', 'error');
      return;
    }

    const payload: GuaranteeLetter = {
      ...this.originalData,
      ...this.editForm.getRawValue(),
      id,
      manufacturerDTO: {
        id: this.editForm.value.manufacturerId
      },
      branchAuthorizedRepresentativeDTO: {
        id: this.editForm.value.branchAuthorizedRepresentativeId
      }
    };

    Swal.fire({
      title: 'Xác nhận lưu?',
      text: 'Bạn có chắc muốn cập nhật thư bảo lãnh này?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Lưu',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#029493'
    }).then(result => {

      if (!result.isConfirmed) return;

      Swal.fire({
        title: 'Đang lưu...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      this.guaranteeService.updateGuaranteeLetter(id, payload).subscribe({
        next: updated => {

          this.originalData = updated;
          this.buildForm(updated);

          Swal.fire('Thành công', 'Đã lưu dữ liệu', 'success')
            .then(() => this.router.navigate(['/manager/danh-sach-bao-lanh']));
        },
        error: () => Swal.fire('Lỗi', 'Không thể cập nhật', 'error')
      });
    });
  }

  cancel(): void {
    this.router.navigate(['manager/danh-sach-bao-lanh']);
  }
}
