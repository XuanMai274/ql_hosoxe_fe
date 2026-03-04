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
            customerId: [null, Validators.required]
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
        const input = event.target.value;
        // Remove non-digit characters
        const numericValue = input.replace(/\D/g, '');
        const val = numericValue ? parseInt(numericValue, 10) : 0;

        // Update form control without triggering another valueChanges if possible, 
        // but it's safe since we're using raw numeric value
        this.contractForm.get('creditLimit')?.setValue(val, { emitEvent: false });

        // Update display
        this.formattedCreditLimit = this.formatCurrency(val);
        // Force the input to show the formatted value
        event.target.value = this.formattedCreditLimit;
    }

    formatCurrency(value: number | string): string {
        if (!value && value !== 0) return '';
        return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
}
