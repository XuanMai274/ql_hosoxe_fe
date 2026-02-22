import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { LoanService } from '../../../service/loan.service';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { Vehicle } from '../../../models/vehicle';

@Component({
  selector: 'app-chi-tiet-khoan-vay',
  imports: [CommonModule, FormsModule,
    ReactiveFormsModule],
  templateUrl: './chi-tiet-khoan-vay.component.html',
  styleUrl: './chi-tiet-khoan-vay.component.css'
})
export class ChiTietKhoanVayComponent {
  loanForm!: FormGroup;
  loanId!: number;
  loading = false;
  vehicle!: Vehicle;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private service: LoanService
  ) { }

  ngOnInit(): void {

    this.loanId = Number(this.route.snapshot.paramMap.get('id'));

    this.initForm();
    this.loadData();
    this.handleAutoCalculate();
  }

  /* ================= INIT FORM ================= */

  initForm() {
    this.loanForm = this.fb.group({
      loanContractNumber: [{ value: '' }],
      accountNumber: [{ value: '' }],
      loanTerm: [''],
      loanDate: [''],
      dueDate: [''],
      loanAmount: [''],
      collateralAndPurpose: [''],
      loanStatus: ['ACTIVE'],
      docId: ['']
    });
  }

  /* ================= LOAD DATA ================= */

  loadData() {

    this.service.getDetail(this.loanId).subscribe({
      next: (res: any) => {

        console.log('Loan detail:', res);
        this.vehicle = res.vehicleDTO;
        this.loanForm.patchValue({
          loanContractNumber: res.loanContractNumber,
          accountNumber: res.accountNumber,
          loanTerm: res.loanTerm,
          loanDate: this.formatDate(res.loanDate),
          dueDate: this.formatDate(res.dueDate),
          loanAmount: res.loanAmount,
          collateralAndPurpose: res.collateralAndPurpose,
          loanStatus: res.loanStatus,
          docId: res.docId
        });

        if (res.loanStatus === 'CLOSED') {
          this.loanForm.disable();
        }
      },
      error: (err) => {
        console.error('Load loan detail error', err);
      }
    });
  }

  /* ================= FORMAT DATE ================= */

  formatDate(date: string | null): string | null {
    if (!date) return null;
    return date.substring(0, 10); // yyyy-MM-dd
  }

  /* ================= AUTO CALCULATE ================= */

  handleAutoCalculate() {
    this.loanForm.get('loanTerm')?.valueChanges.subscribe(term => {
      const loanDate = this.loanForm.get('loanDate')?.value;
      if (loanDate && term) {
        const newDate = this.addMonths(loanDate, term);
        this.loanForm.get('dueDate')?.setValue(newDate);
      }
    });
  }

  addMonths(dateString: string, months: number): string {
    const date = new Date(dateString);
    date.setMonth(date.getMonth() + Number(months));
    return date.toISOString().substring(0, 10);
  }
  save() {

  }
  goBack() {
    window.history.back();
  }

}
