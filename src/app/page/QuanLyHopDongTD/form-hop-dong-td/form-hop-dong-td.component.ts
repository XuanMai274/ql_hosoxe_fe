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
            creditLimit: [0, [Validators.required, Validators.min(0)]],
            customerId: [null, Validators.required]
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

        const data = this.contractForm.value;
        if (this.isEditMode && this.contractId) {
            this.creditContractService.updateCreditContract(this.contractId, data).subscribe({
                next: () => this.router.navigate(['/manager/credit-contract']),
                error: (err) => alert(err.error?.message || 'Có lỗi xảy ra khi cập nhật')
            });
        } else {
            // Khi thêm mới, mặc định trạng thái là ACTIVE
            const newData = { ...data, status: 'ACTIVE' };
            this.creditContractService.addCreditContract(newData).subscribe({
                next: () => this.router.navigate(['/manager/credit-contract']),
                error: (err) => alert(err.error?.message || 'Có lỗi xảy ra khi thêm mới')
            });
        }
    }
}
