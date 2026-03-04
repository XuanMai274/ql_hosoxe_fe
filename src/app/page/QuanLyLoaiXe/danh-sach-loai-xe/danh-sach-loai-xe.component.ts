import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ManufacturerService } from '../../../service/manufacturer.service';
import { Manufacturer } from '../../../models/manufacturer';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-danh-sach-loai-xe',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './danh-sach-loai-xe.component.html',
    styleUrl: './danh-sach-loai-xe.component.css'
})
export class DanhSachLoaiXeComponent implements OnInit {
    manufacturers: Manufacturer[] = [];
    isLoading = false;

    constructor(
        private manufacturerService: ManufacturerService,
        private toastr: ToastrService
    ) { }

    getLogoUrl(logo: string | undefined): string {
        if (!logo) return 'assets/public/img/logo.webp';
        if (logo.includes('uploads')) {
            return 'http://localhost:8080' + (logo.startsWith('/') ? '' : '/') + logo;
        }
        return 'http://localhost:8080/uploads/' + logo;
    }

    ngOnInit(): void {
        this.loadData();
    }

    loadData(): void {
        this.isLoading = true;
        this.manufacturerService.getManufacture().subscribe({
            next: (data: Manufacturer[]) => {
                this.manufacturers = data;
                this.isLoading = false;
            },
            error: () => {
                this.toastr.error('Lỗi khi tải danh sách loại xe');
                this.isLoading = false;
            }
        });
    }
}
