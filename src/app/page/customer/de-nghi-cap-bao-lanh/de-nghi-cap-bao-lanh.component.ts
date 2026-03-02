import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators, AbstractControl } from '@angular/forms';
import { GuaranteeApplication } from '../../../models/guarantee_application.model';
import { GuaranteeApplicationService } from '../../../service/guarantee_application_service';
import { Manufacturer } from '../../../models/manufacturer';
import { ManufacturerService } from '../../../service/manufacturer.service';
import { forkJoin } from 'rxjs';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { AuthServiceComponent } from '../../../core/service/auth-service.component';

@Component({
    selector: 'app-de-nghi-cap-bao-lanh',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    templateUrl: './de-nghi-cap-bao-lanh.component.html',
    styleUrl: './de-nghi-cap-bao-lanh.component.css'
})
export class DeNghiCapBaoLanhComponent implements OnInit {

    donHangList: GuaranteeApplication[] = [];
    loading = true;
    error = '';

    // Filter
    selectedManufacturerId: any = '';
    fromDate = '';
    toDate = '';
    statusSearch = '';

    manufacturers: Manufacturer[] = [];

    loadManufacturers(): void {
        this.manufacturerService.getManufactureCustomer().subscribe({
            next: (data) => {
                this.manufacturers = data;
            },
            error: (err) => {
                console.error('Lỗi load manufacturer', err);
            }
        });
    }

    // Pagination
    page = 0;
    size = 20;
    totalPages = 1;

    // Modal chi tiết
    showDetail = false;
    selectedItem: GuaranteeApplication | null = null;

    // Config tỉ lệ bảo lãnh theo hãng xe
    getTileByCode(code: string): number {
        const manufacturer = this.manufacturers
            .find(m => m.code?.toUpperCase() === code?.toUpperCase());

        if (!manufacturer?.guaranteeRate) return 75;

        return Math.round(manufacturer.guaranteeRate * 100);
    }

    // Modal form tạo mới
    showForm = false;
    submitting = false;
    newForm: FormGroup;

    constructor(
        private guaranteeAppService: GuaranteeApplicationService,
        private manufacturerService: ManufacturerService,
        private fb: FormBuilder,
        private authService: AuthServiceComponent
    ) {
        this.newForm = this.fb.group({
            manufacturerCode: ['', Validators.required],
            vehicles: this.fb.array([this.createVehicleRow()])
        });
    }

    ngOnInit(): void {
        this.loadData();
        this.loadManufacturers()
    }

    loadData(page = 0) {
        this.page = page;
        this.loading = true;
        this.error = '';

        this.guaranteeAppService.getList(
            this.selectedManufacturerId || undefined,
            this.fromDate || undefined,
            this.toDate || undefined,
            this.statusSearch || undefined,
            this.page,
            this.size
        ).subscribe({
            next: (res) => {
                this.donHangList = res.content;
                this.totalPages = res.totalPages || 1;
                this.loading = false;
            },
            error: () => {
                // this.donHangList = this.getMockData();
                this.totalPages = 1;
                this.loading = false;
                // this.error = 'Không thể tải danh sách đề nghị bảo lãnh';
            }
        });
    }

    applyFilter() { this.loadData(0); }

    resetFilter() {
        this.selectedManufacturerId = '';
        this.fromDate = '';
        this.toDate = '';
        this.statusSearch = '';
        this.loadData(0);
    }

    prev() { if (this.page > 0) this.loadData(this.page - 1); }
    next() { if (this.page + 1 < this.totalPages) this.loadData(this.page + 1); }

    // ===== MODAL CHI TIẾT =====
    openDetail(item: GuaranteeApplication): void {
        if (!item.id) return;
        this.loading = true;
        this.guaranteeAppService.getById(item.id).subscribe({
            next: (res) => {
                this.selectedItem = res;
                this.showDetail = true;
                this.loading = false;
                document.body.style.overflow = 'hidden';
            },
            error: (err) => {
                console.error('Lỗi khi tải chi tiết', err);
                // Fallback to item from list if API fails
                this.selectedItem = item;
                this.showDetail = true;
                this.loading = false;
                document.body.style.overflow = 'hidden';
            }
        });
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
        const userId = this.authService.getUserId();
        const customer = { id: userId ? Number(userId) : null }; // Lấy từ AuthService

        this.submitting = true;
        const manufacturerCode = this.newForm.get('manufacturerCode')?.value;

        // Map vehicles
        const vehicles = this.vehicles.controls.map(row => ({
            vehicleName: row.get('loaiXe')?.value,
            vehicleType: row.get('loaiXe')?.value,
            color: row.get('mauXe')?.value,
            chassisNumber: row.get('soKhung')?.value,
            invoiceNumber: row.get('soDonHang')?.value, // map to invoiceNumber or similar
            vehiclePrice: row.get('giaXe')?.value
        }));

        const payload: any = {
            customerDTO: { id: customer.id },
            manufacturerDTO: { id: this.getManufacturerIdByCode(manufacturerCode) },
            vehicles: vehicles
        };

        this.guaranteeAppService.create(payload).subscribe({
            next: (res) => {
                if (!res.id) {
                    alert('Không tìm thấy ID');
                    return;
                }
                if (!res.id || !res.subGuaranteeContractNumber) {
                    alert('Thiếu dữ liệu xuất file');
                    return;
                }
                this.submitting = false;
                this.closeForm();
                this.loadData(0);
                this.downloadZip(res.id, res.subGuaranteeContractNumber);
            },
            error: (err) => {
                console.error(err);
                this.submitting = false;
                alert('Có lỗi khi tạo đơn bảo lãnh');
            }
        });
    }

    getManufacturerIdByCode(code: string): number {
        const manufacturer = this.manufacturers
            .find(m => m.code?.toUpperCase() === code?.toUpperCase());
        return manufacturer?.id || 0;
    }

    /** Tổng giá trị bảo lãnh hiển thị */
    get tongGiaTriBaoLanh(): number {
        return this.donHangList.reduce((sum, item) => sum + (item.totalGuaranteeAmount || 0), 0);
    }

    getTiLeBaoLanh(item: GuaranteeApplication): number {
        if (item.manufacturerDTO?.guaranteeRate) {
            return Math.round(item.manufacturerDTO.guaranteeRate * 100);
        }
        if (!item.totalVehicleAmount || !item.totalGuaranteeAmount) return 0;
        return Math.round((item.totalGuaranteeAmount / item.totalVehicleAmount) * 100);
    }

    getManufacturerClass(item: GuaranteeApplication): string {
        const code = item.manufacturerDTO?.code?.toUpperCase();
        if (code === 'VINFAST') return 'tag-vinfast';
        if (code === 'HYUNDAI') return 'tag-hyundai';
        return 'tag-default';
    }

    getStatusClass(status?: string): string {
        const s = status?.toUpperCase() || '';
        if (s.includes('PENDING')) return 'status-pending';
        switch (s) {
            case 'APPROVED': case 'ACTIVE': return 'status-active';
            case 'REJECTED': case 'EXPIRED': return 'status-expired';
            default: return 'status-default';
        }
    }

    getStatusLabel(status?: string): string {
        const s = status?.toUpperCase() || '';
        if (s.includes('PENDING')) return 'Chờ duyệt';
        switch (s) {
            case 'APPROVED': case 'ACTIVE': return 'Đã duyệt';
            case 'REJECTED': return 'Từ chối';
            case 'EXPIRED': return 'Hết hạn';
            default: return status || '—';
        }
    }

    countStatus(status: string): number {
        return this.donHangList.filter(item => {
            const s = item.status?.toUpperCase();
            if (status === 'ACTIVE') return s === 'ACTIVE' || s === 'APPROVED';
            return s === status.toUpperCase();
        }).length;
    }
    downloadZip(id: number, contractNumber: string) {

        this.submitting = true;

        forkJoin({
            deNghi: this.guaranteeAppService.exportDeNghi(id),
            danhSach: this.guaranteeAppService.exportDanhSachXe(id)
        }).subscribe({

            next: async ({ deNghi, danhSach }) => {

                const zip = new JSZip();

                zip.file(
                    `${contractNumber}_de-nghi-cap-bao-lanh.docx`,
                    deNghi
                );

                zip.file(
                    `${contractNumber}_danh-sach-xe-cap-bao-lanh.docx`,
                    danhSach
                );

                const zipBlob = await zip.generateAsync({ type: 'blob' });

                saveAs(zipBlob, `${contractNumber}.zip`);

                this.submitting = false;
            },

            error: () => {
                this.submitting = false;
                alert('Lỗi khi xuất file');
            }
        });
    }
}

