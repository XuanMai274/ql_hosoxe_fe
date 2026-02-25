import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators, AbstractControl } from '@angular/forms';
import { GuaranteeLetter } from '../../../models/guarantee_letter';
import { CustomerGuaranteeService } from '../../../service/customer-guarantee.service';

@Component({
    selector: 'app-don-hang-bao-lanh',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    templateUrl: './don-hang-bao-lanh.component.html',
    styleUrl: './don-hang-bao-lanh.component.css'
})
export class DonHangBaoLanhComponent implements OnInit {

    donHangList: GuaranteeLetter[] = [];
    loading = true;
    error = '';

    // Filter
    selectedManufacturer = '';
    fromDate = '';
    toDate = '';

    manufacturers = [
        { code: 'VINFAST', name: 'VinFast' },
        { code: 'HYUNDAI', name: 'Hyundai' }
    ];

    // Pagination
    page = 0;
    size = 20;
    totalPages = 1;

    // Modal chi tiết
    showDetail = false;
    selectedItem: GuaranteeLetter | null = null;

    // Config tỉ lệ bảo lãnh theo hãng xe
    tileMap: Record<string, number> = {
        'VINFAST': 75,
        'HYUNDAI': 85
    };

    // Modal form tạo mới
    showForm = false;
    submitting = false;
    newForm: FormGroup;

    constructor(
        private service: CustomerGuaranteeService,
        private fb: FormBuilder
    ) {
        this.newForm = this.fb.group({
            manufacturerCode: ['', Validators.required],
            vehicles: this.fb.array([this.createVehicleRow()])
        });
    }

    ngOnInit(): void {
        this.loadData();
    }

    loadData(page = 0) {
        this.page = page;
        this.loading = true;
        this.error = '';

        this.service.getDonHangBaoLanh(
            this.selectedManufacturer || undefined,
            this.fromDate || undefined,
            this.toDate || undefined,
            this.page,
            this.size
        ).subscribe({
            next: (res) => {
                this.donHangList = res.content;
                this.totalPages = res.totalPages || 1;
                this.loading = false;
            },
            error: () => {
                this.donHangList = this.getMockData();
                this.totalPages = 1;
                this.loading = false;
            }
        });
    }

    applyFilter() { this.loadData(0); }

    resetFilter() {
        this.selectedManufacturer = '';
        this.fromDate = '';
        this.toDate = '';
        this.loadData(0);
    }

    prev() { if (this.page > 0) this.loadData(this.page - 1); }
    next() { if (this.page + 1 < this.totalPages) this.loadData(this.page + 1); }

    // ===== MODAL CHI TIẾT =====
    openDetail(item: GuaranteeLetter): void {
        this.selectedItem = item;
        this.showDetail = true;
        document.body.style.overflow = 'hidden';
    }

    closeDetail(): void {
        this.showDetail = false;
        this.selectedItem = null;
        document.body.style.overflow = '';
    }

    // ===== MODAL FORM TẠO MỚI =====
    openForm(): void {
        this.newForm.reset();
        // Reset về 1 dòng trống
        while (this.vehicles.length > 0) this.vehicles.removeAt(0);
        this.vehicles.push(this.createVehicleRow());
        this.showForm = true;
        document.body.style.overflow = 'hidden';
    }

    closeForm(): void {
        this.showForm = false;
        document.body.style.overflow = '';
    }

    // ===== FORM ARRAY =====
    get vehicles(): FormArray {
        return this.newForm.get('vehicles') as FormArray;
    }

    createVehicleRow(): FormGroup {
        return this.fb.group({
            loaiXe: ['', Validators.required],
            mauXe: ['', Validators.required],
            soKhung: [''],
            soDonHang: [''],
            giaXe: [null, [Validators.required, Validators.min(1)]]
        });
    }

    addVehicleRow(): void {
        this.vehicles.push(this.createVehicleRow());
    }

    removeVehicleRow(index: number): void {
        if (this.vehicles.length > 1) {
            this.vehicles.removeAt(index);
        }
    }

    // Tỉ lệ bảo lãnh theo hãng
    getTileByCode(code: string): number {
        return this.tileMap[code?.toUpperCase()] || 75;
    }

    // Tính giá trị BL cho từng dòng
    getGiaTriBL(row: AbstractControl): number {
        const giaXe = row.get('giaXe')?.value || 0;
        const tile = this.getTileByCode(this.newForm.get('manufacturerCode')?.value);
        return giaXe * tile / 100;
    }

    // Tổng giá xe
    get tongGiaXe(): number {
        return this.vehicles.controls.reduce((s, r) => s + (r.get('giaXe')?.value || 0), 0);
    }

    // Tổng giá trị bảo lãnh
    get tongGiaTriBLForm(): number {
        return this.vehicles.controls.reduce((s, r) => s + this.getGiaTriBL(r), 0);
    }

    isRowInvalid(index: number, field: string): boolean {
        const ctrl = this.vehicles.at(index).get(field);
        return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
    }

    isInvalid(field: string): boolean {
        const ctrl = this.newForm.get(field);
        return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
    }

    submitForm(): void {
        if (this.newForm.invalid) {
            this.newForm.markAllAsTouched();
            return;
        }
        this.submitting = true;
        // TODO: Gọi API tạo đơn hàng
        setTimeout(() => {
            this.submitting = false;
            this.closeForm();
            this.loadData(0);
        }, 1000);
    }

    /** Tổng giá trị bảo lãnh */
    get tongGiaTriBaoLanh(): number {
        return this.donHangList.reduce((sum, item) => sum + (item.totalGuaranteeAmount || 0), 0);
    }

    tinhGiaTriBaoLanh(item: GuaranteeLetter): number {
        const giaXe = item.saleContractAmount || 0;
        const tiLe = this.getTiLeBaoLanh(item);
        return giaXe * (tiLe / 100);
    }

    getTiLeBaoLanh(item: GuaranteeLetter): number {
        if (item.manufacturerDTO?.guaranteeRate) {
            return Math.round(item.manufacturerDTO.guaranteeRate * 100);
        }
        if (!item.saleContractAmount || !item.totalGuaranteeAmount) return 0;
        return Math.round((item.totalGuaranteeAmount / item.saleContractAmount) * 100);
    }

    getManufacturerClass(item: GuaranteeLetter): string {
        const code = item.manufacturerDTO?.code?.toUpperCase();
        if (code === 'VINFAST') return 'tag-vinfast';
        if (code === 'HYUNDAI') return 'tag-hyundai';
        return 'tag-default';
    }

    getStatusClass(status?: string): string {
        switch (status?.toUpperCase()) {
            case 'ACTIVE': return 'status-active';
            case 'EXPIRED': return 'status-expired';
            case 'PENDING': return 'status-pending';
            default: return 'status-default';
        }
    }

    getStatusLabel(status?: string): string {
        switch (status?.toUpperCase()) {
            case 'ACTIVE': return 'Đã duyệt';
            case 'EXPIRED': return 'Hết hạn';
            case 'PENDING': return 'Chưa duyệt';
            default: return status || '—';
        }
    }

    private getMockData(): GuaranteeLetter[] {
        return [
            {
                id: 1,
                guaranteeContractNumber: 'BL-2024-001',
                manufacturerDTO: { code: 'VINFAST', name: 'VinFast', guaranteeRate: 0.75, templateCode: 'VINFAST_V1' },
                saleContractAmount: 302400000,
                totalGuaranteeAmount: 226800000,
                usedAmount: 100000000,
                remainingAmount: 126800000,
                expectedVehicleCount: 5,
                importedVehicleCount: 3,
                exportedVehicleCount: 1,
                status: 'ACTIVE',
                guaranteeContractDate: '2024-01-15',
                createdAt: '2024-01-10T08:00:00'
            },
            {
                id: 2,
                guaranteeContractNumber: 'BL-2024-002',
                manufacturerDTO: { code: 'HYUNDAI', name: 'Hyundai', guaranteeRate: 0.85, templateCode: 'HYUNDAI_V1' },
                saleContractAmount: 500000000,
                totalGuaranteeAmount: 425000000,
                usedAmount: 200000000,
                remainingAmount: 225000000,
                expectedVehicleCount: 8,
                importedVehicleCount: 5,
                exportedVehicleCount: 2,
                status: 'ACTIVE',
                guaranteeContractDate: '2024-02-20',
                createdAt: '2024-02-15T10:30:00'
            }
        ] as any[];
    }
}

