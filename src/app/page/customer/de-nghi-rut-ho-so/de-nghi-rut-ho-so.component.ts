import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerWarehouseService } from '../../../service/customer-warehouse.service';
import { Vehicle } from '../../../models/vehicle';
import { WarehouseExportDTO } from '../../../models/warehouseExport.model';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { switchMap } from 'rxjs';
import { WarehouseExportService } from '../../../service/warehouse-export.service';

@Component({
    selector: 'app-de-nghi-rut-ho-so',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './de-nghi-rut-ho-so.component.html',
    styleUrl: './de-nghi-rut-ho-so.component.css'
})
export class DeNghiRutHoSoComponent implements OnInit {

    vehiclesAll: Vehicle[] = [];
    filteredVehicles: Vehicle[] = [];
    vehicles: Vehicle[] = [];
    selectedVehicles: Vehicle[] = [];
    exportResult?: WarehouseExportDTO;
    loading = false;
    currentStep = 1;
    today = new Date();

    // ===== FILTER =====
    chassisNumber = '';
    status = '';
    manufacturer = '';
    loanContractNumber = '';

    // ===== PAGING =====
    page = 0;
    size = 10;
    totalPages = 0;

    constructor(
        private service: CustomerWarehouseService,
        private router: Router,
        private exportService: WarehouseExportService
    ) { }

    get totalGuaranteeAmount(): number {
        return this.selectedVehicles.reduce((sum, v) => sum + (v.guaranteeAmount || 0), 0);
    }

    ngOnInit(): void {
        this.loadVehicles();
    }

    loadVehicles(): void {
        this.loading = true;
        this.service.getAvailableForExport(
            'Giữ trong kho',
            this.page,
            this.size,
            this.chassisNumber,
            this.manufacturer,
            this.loanContractNumber
        ).subscribe({
            next: (res: any) => {
                this.vehicles = res.content;
                this.totalPages = res.totalPages;
                this.loading = false;
                console.log("danh sách xe: ", res)
                console.log("danh sách xe: ", res.content)
            },
            error: (err) => {
                console.error('Lỗi load xe:', err);
                Swal.fire('Lỗi', 'Không thể tải danh sách xe.', 'error');
                this.loading = false;
            }
        });
    }
    // ===== SEARCH =====
    search(): void {
        this.page = 0;
        this.loadVehicles();
    }

    // ===== DEADLINE FILTER =====
    matchDeadlineStatus(vehicle: Vehicle): boolean {
        if (!this.status) return true;
        const label = vehicle.deadlineLabel || '';
        switch (this.status) {
            case 'Giữ két':
                return label.includes('Còn');
            case 'Giữ trong kho':
                return label.includes('hôm nay');
            case 'Đã trả khách hàng':
                return label.includes('quá hạn');
            default:
                return true;
        }
    }

    // ===== DEADLINE CSS =====
    getDeadlineClass(label: string): string {
        if (!label) return '';
        if (label.includes('quá hạn')) return 'deadline-overdue';
        if (label.includes('hôm nay')) return 'deadline-today';
        return 'deadline-warning';
    }

    changePage(p: number): void {
        if (p < 0 || p >= this.totalPages) return;
        this.page = p;
        this.loadVehicles();
    }

    onSelectVehicle(vehicle: Vehicle, event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.checked) {
            this.selectedVehicles.push(vehicle);
        } else {
            this.selectedVehicles = this.selectedVehicles.filter(v => v.id !== vehicle.id);
        }
    }

    isSelected(vehicle: Vehicle): boolean {
        return this.selectedVehicles.some(v => v.id === vehicle.id);
    }

    nextStep(): void {
        if (this.selectedVehicles.length === 0) {
            Swal.fire('Thông báo', 'Vui lòng chọn ít nhất một chiếc xe để rút hồ sơ.', 'warning');
            return;
        }
        this.currentStep = 2;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    prevStep(): void {
        this.currentStep = 1;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    confirmRequest(): void {
        if (this.selectedVehicles.length === 0) return;

        this.loading = true;

        const vehicleIds = this.selectedVehicles
            .map(v => v.id!)
            .filter(id => !!id);

        const requestDto: WarehouseExportDTO = {
            vehicleIds: vehicleIds
        };

        this.service.requestExport(requestDto).pipe(
            switchMap((res: WarehouseExportDTO) => {

                this.exportResult = res;
                // if (res.id) {
                //     this.exportService.getVehiclesByExportId(res.id).subscribe({
                //         next: (data) => {
                //             this.vehicles = data;
                //         },
                //         error: (err) => {
                //             console.error('Error loading vehicles for request:', err);
                //         }
                //     });
                // }
                console.log("WareHouseEx trả về: ",this.exportResult);
                const exportDto: WarehouseExportDTO = {
                    id: res.id,
                    vehicleIds: vehicleIds   // GIỮ NGUYÊN danh sách ban đầu
                };

                return this.service.exportSpecific(this.exportResult);
            })
        ).subscribe({
            next: (blob: Blob) => {

                this.loading = false;

                const fileName = `XuatKho_${new Date().getTime()}.zip`;
                const link = document.createElement('a');
                const url = window.URL.createObjectURL(blob);

                link.href = url;
                link.download = fileName;
                link.click();

                window.URL.revokeObjectURL(url);

                Swal.fire({
                    title: 'Thành công!',
                    text: 'Tạo yêu cầu và xuất file thành công.',
                    icon: 'success',
                    confirmButtonColor: '#028B89'
                }).then(() => {
                    this.router.navigate(['/customer/de-nghi-nhap-kho']);
                });
            },
            error: (err) => {
                this.loading = false;
                Swal.fire('Lỗi', err.error || 'Tạo yêu cầu thất bại.', 'error');
            }
        });
    }
    formatCurrency(amount?: number): string {
        if (!amount) return '—';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    }
}
