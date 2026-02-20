import { Component } from '@angular/core';
import { Vehicle } from '../../../models/vehicle';
import { VehicleService } from '../../../service/vehicle.service';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PageResponse } from '../../../models/page-response';
import { VehicleList } from '../../../models/vehiclelist.model';

@Component({
  selector: 'app-danh-sach-ho-so-xe',
  imports: [ReactiveFormsModule, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './danh-sach-ho-so-xe.component.html',
  styleUrl: './danh-sach-ho-so-xe.component.css'
})
export class DanhSachHoSoXeComponent {
  vehicles: VehicleList[] = [];
  loading = false;

  // filter
  chassisNumber = '';
  status = '';
  manufacturer = '';              // <-- HÃNG XE
  ref = '';   // <-- SỐ thư BẢO LÃNH

  // paging
  page = 0;
  size = 10;
  totalPages = 0;

  constructor(
    private vehicleService: VehicleService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadVehicles();
  }

  loadVehicles(): void {
    this.loading = true;
    this.vehicleService.getVehicles({
      chassisNumber: this.chassisNumber || undefined,
      status: this.status || undefined,
      manufacturer: this.manufacturer || undefined,
      ref:this.ref,
      page: this.page,
      size: this.size
    }).subscribe({
      next: (res: PageResponse<VehicleList>) => {
        this.vehicles = res.content;
        this.totalPages = res.totalPages;
        this.loading = false;
        console.log("API TRẢ VỀ:", res);
      }
    });
  }

  search(): void {
    this.page = 0;
    this.loadVehicles();
  }

  changePage(p: number): void {
    if (p < 0 || p >= this.totalPages) return;
    this.page = p;
    this.loadVehicles();
  }

  viewDetail(id: number): void {
    this.router.navigate(
      ['manager/vehicles/detail', id],
      {
        queryParams: {
          chassisNumber: this.chassisNumber || null,
          status: this.status || null,
          manufacturer: this.manufacturer || null,
          ref: this.ref || null,
          page: this.page
        }
      }
    );
  }

  exportExcel(): void {
    this.vehicleService.exportExcel({
      chassisNumber: this.chassisNumber || undefined,
      status: this.status || undefined,
      manufacturer: this.manufacturer || undefined,
      ref: this.ref || undefined
    }).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'danh_sach_xe.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }

}
