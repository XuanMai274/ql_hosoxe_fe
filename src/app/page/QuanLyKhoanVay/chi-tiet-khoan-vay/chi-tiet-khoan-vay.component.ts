import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DisbursementService } from '../../../service/disbursement.service';
import { LoanService } from '../../../service/loan.service';
import { CommonModule } from '@angular/common';
import { DisbursementDTO } from '../../../models/disbursement.model';
import { LoanDTO } from '../../../models/loan.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-chi-tiet-khoan-vay',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './chi-tiet-khoan-vay.component.html',
  styleUrl: './chi-tiet-khoan-vay.component.css'
})
export class ChiTietKhoanVayComponent implements OnInit {
  disbursementForm!: FormGroup;
  loanEditForm!: FormGroup;

  disbursementId!: number;
  loading = false;
  disbursement: DisbursementDTO | null = null;

  showLoanModal = false;
  editingLoan: LoanDTO | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private disbursementService: DisbursementService,
    private loanService: LoanService
  ) { }

  ngOnInit(): void {
    this.disbursementId = Number(this.route.snapshot.paramMap.get('id'));
    this.initForms();
    this.loadData();
  }

  initForms() {
    // Form cho Disbursement
    this.disbursementForm = this.fb.group({
      loanContractNumber: ['', Validators.required],
      disbursementDate: [''],
      loanTerm: [null],
      interestRate: [null],
      status: ['']
    });

    // Form cho Loan đơn lẻ
    this.loanEditForm = this.fb.group({
      id: [null],
      accountNumber: [''],
      loanAmount: [null, Validators.required],
      loanDate: [''],
      dueDate: [''],
      docId: [''],
      collateralAndPurpose: [''],
      loanStatus: ['']
    });
  }

  loadData() {
    this.loading = true;
    this.disbursementService.getDetail(this.disbursementId).subscribe({
      next: (res) => {
        this.disbursement = res;
        this.disbursementForm.patchValue({
          loanContractNumber: res.loanContractNumber,
          disbursementDate: res.disbursementDate,
          loanTerm: res.loanTerm,
          interestRate: res.interestRate,
          status: res.status
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('Load disbursement detail error', err);
        this.loading = false;
        Swal.fire('Lỗi', 'Không thể tải chi tiết đợt giải ngân', 'error');
      }
    });
  }

  /* ================= DISBURSEMENT ACTIONS ================= */

  saveDisbursement() {
    if (this.disbursementForm.invalid) return;
    this.loading = true;
    this.disbursementService.updateDisbursement(this.disbursementId, {
      ...this.disbursement,
      ...this.disbursementForm.value
    }).subscribe({
      next: () => {
        this.loading = false;
        Swal.fire('Thành công', 'Đã cập nhật thông tin đợt giải ngân', 'success');
        this.loadData();
      },
      error: (err) => {
        this.loading = false;
        Swal.fire('Lỗi', 'Không thể cập nhật đợt giải ngân', 'error');
      }
    });
  }

  /* ================= LOAN ACTIONS ================= */

  openEditLoan(loan: LoanDTO) {
    this.editingLoan = loan;
    this.loanEditForm.patchValue({
      id: loan.id,
      accountNumber: loan.accountNumber,
      loanAmount: loan.loanAmount,
      loanDate: loan.loanDate ? loan.loanDate.substring(0, 10) : '',
      dueDate: loan.dueDate ? loan.dueDate.substring(0, 10) : '',
      docId: loan.docId,
      collateralAndPurpose: loan.collateralAndPurpose,
      loanStatus: loan.loanStatus
    });
    this.showLoanModal = true;
  }

  closeLoanModal() {
    this.showLoanModal = false;
    this.editingLoan = null;
  }

  saveLoan() {
    if (this.loanEditForm.invalid || !this.editingLoan?.id) return;

    this.loanService.updateLoan(this.editingLoan.id, this.loanEditForm.value).subscribe({
      next: () => {
        Swal.fire('Thành công', 'Đã cập nhật khoản vay', 'success');
        this.closeLoanModal();
        this.loadData(); // Reload list
      },
      error: (err) => {
        Swal.fire('Lỗi', 'Không thể cập nhật khoản vay', 'error');
      }
    });
  }

  /* ================= HELPERS ================= */

  getStatusClass(status?: string): string {
    switch (status?.toUpperCase()) {
      case 'ACTIVE': return 'status-active';
      case 'PAID':
      case 'PAID_OFF': return 'status-closed';
      case 'OVERDUE': return 'status-overdue';
      default: return 'status-default';
    }
  }

  getStatusLabel(status?: string): string {
    switch (status?.toUpperCase()) {
      case 'ACTIVE': return 'Đang vay';
      case 'PAID':
      case 'PAID_OFF': return 'Đã tất toán';
      case 'OVERDUE': return 'Quá hạn';
      default: return status || '—';
    }
  }

  goBack() {
    window.history.back();
  }
}
