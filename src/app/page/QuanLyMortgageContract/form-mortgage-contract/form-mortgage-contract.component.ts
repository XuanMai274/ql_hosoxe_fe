import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MortgageContractService } from '../../../service/mortgage-contract.service';
import { CustomerService } from '../../../service/customer.service';
import { ManufacturerService } from '../../../service/manufacturer.service';
import { Customer } from '../../../models/customer.model';
import { MortgageContract } from '../../../models/mortgage-contract.model';

@Component({
    selector: 'app-form-mortgage-contract',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
    templateUrl: './form-mortgage-contract.component.html',
    styleUrl: './form-mortgage-contract.component.css'
})
export class FormMortgageContractComponent implements OnInit {
    contractForm: FormGroup;
    isEditMode = false;
    contractId: number | null = null;
    customers: Customer[] = [];
    manufacturers: any[] = [];
    isLoading = false;
    formattedTotalValue = '0';

    constructor(
        private fb: FormBuilder,
        private mortgageContractService: MortgageContractService,
        private customerService: CustomerService,
        private manufacturerService: ManufacturerService,
        private route: ActivatedRoute,
        private router: Router
    ) {
        this.contractForm = this.fb.group({
            contractNumber: ['', Validators.required],
            contractDate: ['', Validators.required],
            expiryDate: [{ value: '', disabled: true }],
            totalCollateralValue: [0, [Validators.required, Validators.min(0)]],
            securityRegistrationNumber: [''],
            personalIdNumber: [''],
            status: ['ACTIVE'],
            customerId: [null, Validators.required],
            manufacturerId: [null]
        });

        // Sync display value when totalCollateralValue changes
        this.contractForm.get('totalCollateralValue')?.valueChanges.subscribe(value => {
            this.formattedTotalValue = this.formatCurrency(value || 0);
        });
    }

    ngOnInit(): void {
        this.loadCustomers();
        this.loadManufacturers();
        this.checkEditMode();
        this.onContractDateChange();
    }

    onContractDateChange(): void {
        this.contractForm.get('contractDate')?.valueChanges.subscribe(val => {
            if (val) {
                const date = new Date(val);
                date.setFullYear(date.getFullYear() + 1);
                this.contractForm.get('expiryDate')?.setValue(date.toISOString().split('T')[0]);
            }
        });
    }

    loadCustomers(): void {
        this.customerService.getCustomers().subscribe({
            next: (data) => (this.customers = data),
            error: (err) => console.error('Error loading customers', err)
        });
    }

    loadManufacturers(): void {
        this.manufacturerService.getManufacture().subscribe({
            next: (data: any[]) => (this.manufacturers = data),
            error: (err: any) => console.error('Error loading manufacturers', err)
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
        this.mortgageContractService.getMortgageContractById(id).subscribe({
            next: (contract) => {
                if (contract) {
                    if (contract.contractDate) {
                        contract.contractDate = new Date(contract.contractDate).toISOString().split('T')[0];
                    }
                    if (contract.expiryDate) {
                        contract.expiryDate = new Date(contract.expiryDate).toISOString().split('T')[0];
                    }
                    // Extract id from manufacturerDTO for the form
                    const patchData: any = { ...contract };
                    if (contract.manufacturerDTO) {
                        patchData.manufacturerId = contract.manufacturerDTO.id;
                    }
                    this.contractForm.patchValue(patchData);
                    // Manually trigger display update
                    this.formattedTotalValue = this.formatCurrency(contract.totalCollateralValue || 0);
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

        const formData = { ...this.contractForm.getRawValue() };

        // Convert manufacturerId back to manufacturerDTO object
        if (formData.manufacturerId) {
            formData.manufacturerDTO = { id: formData.manufacturerId };
            delete formData.manufacturerId;
        }

        this.isLoading = true;

        if (this.isEditMode && this.contractId) {
            this.mortgageContractService.updateMortgageContract(this.contractId, formData).subscribe({
                next: () => this.router.navigate(['/manager/mortgage-contract']),
                error: (err) => {
                    this.isLoading = false;
                    alert(err.error?.message || 'Có lỗi xảy ra khi cập nhật');
                }
            });
        } else {
            this.mortgageContractService.addMortgageContract(formData).subscribe({
                next: () => this.router.navigate(['/manager/mortgage-contract']),
                error: (err) => {
                    this.isLoading = false;
                    alert(err.error?.message || 'Có lỗi xảy ra khi thêm mới');
                }
            });
        }
    }

    onValueInput(event: any): void {
        const input = event.target.value;
        const numericValue = input.replace(/\D/g, '');
        const val = numericValue ? parseInt(numericValue, 10) : 0;

        this.contractForm.get('totalCollateralValue')?.setValue(val, { emitEvent: false });
        this.formattedTotalValue = this.formatCurrency(val);
        event.target.value = this.formattedTotalValue;
    }

    formatCurrency(value: number | string): string {
        if (!value && value !== 0) return '';
        return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
}
