import { Component, Input, OnInit } from '@angular/core';
import { GuaranteeLetter } from '../../../models/guarantee_letter';
import { GuaranteeLetterService } from '../../../service/guarantee-letter.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PageResponse } from '../../../models/page-response';
import { RouterModule } from '@angular/router';
import { GuaranteeLetterFile } from '../../../models/guarantee_letter_file';

@Component({
  selector: 'app-danh-sach-bao-lanh',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormsModule, RouterModule],
  templateUrl: './danh-sach-bao-lanh.component.html',
  styleUrl: './danh-sach-bao-lanh.component.css'
})
export class DanhSachBaoLanhComponent implements OnInit {

  @Input() item!: GuaranteeLetter;

  filterForm!: FormGroup;

  keyword = '';
  guaranteeLetters: GuaranteeLetter[] = [];

  page = 0;
  size = 10;
  totalPages = 0;

  manufacturers = [
    { code: 'VINFAST', name: 'VinFast' },
    { code: 'HYUNDAI', name: 'Hyundai' }
  ];

  constructor(
    private fb: FormBuilder,
    private service: GuaranteeLetterService
  ) { }

  ngOnInit() {
    this.filterForm = this.fb.group({
      manufacturerCode: [''],
      fromDate: [''],
      toDate: [''],
      hasLetterNumber: ['']
    });

    this.search(0);
  }

  // ================= SEARCH =================
  search(page: number) {

    this.page = page;
    const formValue = this.filterForm.value;

    let hasLetterNumber: boolean | undefined = undefined;

    if (formValue.hasLetterNumber === 'true') {
      hasLetterNumber = true;
    }

    if (formValue.hasLetterNumber === 'false') {
      hasLetterNumber = false;
    }

    this.service.search(
      this.keyword || undefined,
      formValue.manufacturerCode || undefined,
      formValue.fromDate || undefined,
      formValue.toDate || undefined,
      hasLetterNumber,
      this.page,
      this.size
    ).subscribe((res: PageResponse<GuaranteeLetter>) => {

      this.guaranteeLetters = res.content;
      this.totalPages = res.totalPages || 1;
      this.page = res.number;
    });
  }

  searchByKeyword() {
    this.search(0);
  }

  // ================= UPLOAD FILE =================
  onUploadFile(event: any, item: GuaranteeLetter) {

    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Chỉ cho phép file PDF');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File tối đa 5MB');
      return;
    }

    if (item.fileId) {
      const confirmReplace = confirm('File đã tồn tại. Bạn có muốn thay thế?');
      if (!confirmReplace) return;
    }

    item.uploading = true;

    this.service.uploadFile(item.id!, file).subscribe({
      next: (res: GuaranteeLetterFile) => {
        item.fileId = res;
        item.uploading = false;

        // reset input file
        event.target.value = null;
      },
      error: () => {
        item.uploading = false;
        alert('Upload thất bại');
      }
    });
  }

  // ================= DOWNLOAD FILE =================
  downloadFile(file: GuaranteeLetterFile) {

    if (!file.id) return;

    this.service.downloadFile(file.id).subscribe(blob => {

      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = file.fileName || 'thu-bao-lanh.pdf';
      a.click();

      window.URL.revokeObjectURL(url);
    });
  }

  next() {
    if (this.page + 1 < this.totalPages) {
      this.search(this.page + 1);
    }
  }

  prev() {
    if (this.page > 0) {
      this.search(this.page - 1);
    }
  }

}
