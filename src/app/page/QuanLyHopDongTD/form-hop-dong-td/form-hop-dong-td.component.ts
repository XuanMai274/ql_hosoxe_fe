import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CreditContractService } from '../../../service/credit_contract.service';
import { CustomerService } from '../../../service/customer.service';
import { Customer } from '../../../models/customer.model';
import { CreditContract } from '../../../models/credit_contract';

@Component({
    selector: 'app-form-hop-dong-td',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
    templateUrl: './form-hop-dong-td.component.html',
    styleUrl: './form-hop-dong-td.component.css'
})
export class FormHopDongTDComponent implements OnInit {
    contractForm: FormGroup;
    isEditMode = false;
    contractId: number | null = null;
    customers: Customer[] = [];
    isLoading = false;
    formattedCreditLimit = '0';
    formattedIssuedGuaranteeBalance = '0';
    formattedVehicleLoanBalance = '0';
    formattedRealEstateLoanBalance = '0';
    formattedUsedLimit = '0';
    formattedRemainingLimit = '0';

    fullContract: CreditContract | null = null; // Lưu giữ toàn bộ dữ liệu gốc

    constructor(
        private fb: FormBuilder,
        private creditContractService: CreditContractService,
        private customerService: CustomerService,
        private route: ActivatedRoute,
        private router: Router
    ) {
        this.contractForm = this.fb.group({
            contractNumber: ['', Validators.required],
            contractDate: ['', Validators.required],
            expiryDate: [{ value: '', disabled: true }],
            creditLimit: [0, [Validators.required, Validators.min(0)]],
            issuedGuaranteeBalance: [0, [Validators.min(0)]],
            vehicleLoanBalance: [0, [Validators.min(0)]],
            realEstateLoanBalance: [0, [Validators.min(0)]],
            usedLimit: [{ value: 0, disabled: true }],
            remainingLimit: [{ value: 0, disabled: true }],
            customerId: [null, Validators.required]
        });

        // Listen for balance changes to update usedLimit and remainingLimit
        this.contractForm.valueChanges.subscribe(() => {
            this.calculateLimits();
        });

        // Listen for contractDate changes to update expiryDate
        this.contractForm.get('contractDate')?.valueChanges.subscribe(value => {
            if (value) {
                const date = new Date(value);
                if (!isNaN(date.getTime())) {
                    const expiryDate = new Date(date);
                    expiryDate.setFullYear(date.getFullYear() + 1);
                    const y = expiryDate.getFullYear();
                    const m = (expiryDate.getMonth() + 1).toString().padStart(2, '0');
                    const d = expiryDate.getDate().toString().padStart(2, '0');
                    this.contractForm.patchValue({ expiryDate: `${y}-${m}-${d}` });
                }
            } else {
                this.contractForm.patchValue({ expiryDate: '' });
            }
        });

        // Listen for creditLimit changes to update display string (useful for patchValue)
        this.contractForm.get('creditLimit')?.valueChanges.subscribe(value => {
            this.formattedCreditLimit = this.formatCurrency(value || 0);
        });

        this.contractForm.get('issuedGuaranteeBalance')?.valueChanges.subscribe(value => {
            this.formattedIssuedGuaranteeBalance = this.formatCurrency(value || 0);
        });

        this.contractForm.get('vehicleLoanBalance')?.valueChanges.subscribe(value => {
            this.formattedVehicleLoanBalance = this.formatCurrency(value || 0);
        });

        this.contractForm.get('realEstateLoanBalance')?.valueChanges.subscribe(value => {
            this.formattedRealEstateLoanBalance = this.formatCurrency(value || 0);
        });
    }

    calculateLimits(): void {
        const creditLimit = this.contractForm.get('creditLimit')?.value || 0;
        const issued = this.contractForm.get('issuedGuaranteeBalance')?.value || 0;
        const vehicleLoan = this.contractForm.get('vehicleLoanBalance')?.value || 0;
        const realEstateLoan = this.contractForm.get('realEstateLoanBalance')?.value || 0;

        const usedLimit = issued + vehicleLoan + realEstateLoan;
        const remainingLimit = creditLimit - usedLimit;

        this.contractForm.get('usedLimit')?.setValue(usedLimit, { emitEvent: false });
        this.contractForm.get('remainingLimit')?.setValue(remainingLimit, { emitEvent: false });

        this.formattedUsedLimit = this.formatCurrency(usedLimit);
        this.formattedRemainingLimit = this.formatCurrency(remainingLimit);
    }

    ngOnInit(): void {
        this.loadCustomers();
        this.checkEditMode();
    }

    loadCustomers(): void {
        this.customerService.getCustomers().subscribe({
            next: (data) => (this.customers = data),
            error: (err) => console.error('Error loading customers', err)
        });
    }

    checkEditMode(): void {
        this.route.paramMap.subscribe(params => {
            const id = params.get('id');
            if (id) {
                this.isEditMode = true;
                this.contractId = +id;
                this.loadContractDetails(this.contractId);
            }
        });
    }

    loadContractDetails(id: number): void {
        this.isLoading = true;
        this.creditContractService.getCreditContracts().subscribe({
            next: (contracts) => {
                const contract = contracts.find(c => c.id === id);
                if (contract) {
                    this.fullContract = { ...contract }; // Lưu lại bản gốc

                    if (contract.contractDate) {
                        const d = new Date(contract.contractDate);
                        if (!isNaN(d.getTime())) {
                            const yLocal = d.getFullYear();
                            const mLocal = (d.getMonth() + 1).toString().padStart(2, '0');
                            const ddLocal = d.getDate().toString().padStart(2, '0');
                            contract.contractDate = `${yLocal}-${mLocal}-${ddLocal}`;
                        }
                    }

                    if (contract.expiryDate) {
                        const d = new Date(contract.expiryDate);
                        if (!isNaN(d.getTime())) {
                            const yLocal = d.getFullYear();
                            const mLocal = (d.getMonth() + 1).toString().padStart(2, '0');
                            const ddLocal = d.getDate().toString().padStart(2, '0');
                            contract.expiryDate = `${yLocal}-${mLocal}-${ddLocal}`;
                        }
                    }
                    this.contractForm.patchValue(contract);
                }
                this.isLoading = false;
            },
            error: () => (this.isLoading = false)
        });
    }

    onSubmit(): void {
        if (this.contractForm.invalid) {
            this.contractForm.markAllAsTouched();
            return;
        }

        const formData = this.contractForm.getRawValue();

        if (this.isEditMode && this.contractId && this.fullContract) {
            // Merge dữ liệu từ form vào bản gốc để giữ lại các trường như usedLimit, balance...
            const updateData: CreditContract = {
                ...this.fullContract,
                ...formData
            };

            this.creditContractService.updateCreditContract(this.contractId, updateData).subscribe({
                next: () => this.router.navigate(['/manager/credit-contract']),
                error: (err) => alert(err.error?.message || 'Có lỗi xảy ra khi cập nhật')
            });
        } else {
            // Khi thêm mới, mặc định trạng thái là ACTIVE
            const newData = { ...formData, status: 'ACTIVE' };
            this.creditContractService.addCreditContract(newData).subscribe({
                next: () => this.router.navigate(['/manager/credit-contract']),
                error: (err) => alert(err.error?.message || 'Có lỗi xảy ra khi thêm mới')
            });
        }
    }

    onCreditLimitInput(event: any): void {
        const val = this.parseNumericInput(event);
        this.contractForm.get('creditLimit')?.setValue(val);
        event.target.value = this.formatCurrency(val);
    }

    onIssuedGuaranteeBalanceInput(event: any): void {
        const val = this.parseNumericInput(event);
        this.contractForm.get('issuedGuaranteeBalance')?.setValue(val);
        event.target.value = this.formatCurrency(val);
    }

    onVehicleLoanBalanceInput(event: any): void {
        const val = this.parseNumericInput(event);
        this.contractForm.get('vehicleLoanBalance')?.setValue(val);
        event.target.value = this.formatCurrency(val);
    }

    onRealEstateLoanBalanceInput(event: any): void {
        const val = this.parseNumericInput(event);
        this.contractForm.get('realEstateLoanBalance')?.setValue(val);
        event.target.value = this.formatCurrency(val);
    }

    private parseNumericInput(event: any): number {
        const input = event.target.value;
        const numericValue = input.replace(/\D/g, '');
        return numericValue ? parseInt(numericValue, 10) : 0;
    }

    formatCurrency(value: number | string): string {
        if (!value && value !== 0) return '';
        return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
}
