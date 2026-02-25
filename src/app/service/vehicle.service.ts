import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Vehicle } from '../models/vehicle';
import { VehicleDetail } from '../models/vehicle_detail.model';
import { PageResponse } from '../models/page-response';
import { VehicleList } from '../models/vehiclelist.model';
import { Invoice } from '../models/invoice-data.model';
import { Guarantee } from '../models/guarantee.model';
import { GuaranteeLetter } from '../models/guarantee_letter';

@Injectable({
    providedIn: 'root'
})
export class VehicleService {

    private apiUrl = 'http://localhost:8080/officer/vehicles';

    constructor(private http: HttpClient) { }
    // createVehicle(vehicle: Vehicle): Observable<Vehicle> {
    //     return this.http.post<Vehicle>(`http://localhost:8080/add/vehicle`, vehicle);
    // }

    getVehicles(params: {
        chassisNumber?: string;
        status?: string;
        manufacturer?: string;
        guaranteeContractNumber?: string;
        page: number;
        size: number;
        ref?: string
    }): Observable<PageResponse<VehicleList>> {

        let httpParams = new HttpParams()
            .set('page', params.page)
            .set('size', params.size);

        if (params.chassisNumber) {
            httpParams = httpParams.set('chassisNumber', params.chassisNumber);
        }
        if (params.status) {
            httpParams = httpParams.set('status', params.status);
        }
        if (params.manufacturer) {
            httpParams = httpParams.set('manufacturer', params.manufacturer);
        }
        if (params.ref) {
            httpParams = httpParams.set('ref', params.ref);
        }

        return this.http.get<PageResponse<VehicleList>>(this.apiUrl, {
            params: httpParams
        });
    }

    getVehicleDetail(id: number): Observable<Vehicle> {
        return this.http.get<Vehicle>(`${this.apiUrl}/${id}`);
    }
    getVehicleByStatus(status: string): Observable<Vehicle[]> {
        return this.http.get<Vehicle[]>(`${this.apiUrl}/status/${status}`);
    }

    exportExcel(filters: {
        chassisNumber?: string;
        status?: string;
        manufacturer?: string;
        ref?: string;
    }): Observable<Blob> {

        let params = new HttpParams();

        if (filters.chassisNumber) {
            params = params.set('chassisNumber', filters.chassisNumber);
        }
        if (filters.status) {
            params = params.set('status', filters.status);
        }
        if (filters.manufacturer) {
            params = params.set('manufacturer', filters.manufacturer);
        }
        if (filters.ref) {
            params = params.set('ref', filters.ref);
        }

        return this.http.get(
            `http://localhost:8080/officer/vehicles/export/excel`,
            {
                params,
                responseType: 'blob'
            }
        );
    }
    exportPNK(ids: number[]) {
        return this.http.post(
            'http://localhost:8080/officer/vehicles/nhapkho/export-pnk',
            { vehicleIds: ids },
            { responseType: 'blob' }
        );
    }

    exportBaoCao(ids: number[]) {
        return this.http.post(
            'http://localhost:8080/officer/vehicles/nhapkho/export-bao-cao-dinh-gia',
            { vehicleIds: ids },
            { responseType: 'blob' }
        );
    }

    exportBienBan(ids: number[]) {
        return this.http.post(
            'http://localhost:8080/officer/vehicles/nhapkho/export-bien-ban-dinh-gia',
            { vehicleIds: ids },
            { responseType: 'blob' }
        );
    }

    exporPhuLucHopDongThueChap(ids: number[]) {
        return this.http.post(
            'http://localhost:8080/officer/vehicles/nhapkho/phu-luc-hop-dong-the-chap',
            ids,   // ✅ gửi trực tiếp array
            { responseType: 'blob' }
        );
    }
    exporDangKyGiaoDichDamBao(ids: number[]) {
        return this.http.post(
            'http://localhost:8080/officer/vehicles/nhapkho/dang-ky-giao-dich-dam-bao',
            ids,   // ✅ gửi trực tiếp array
            { responseType: 'blob' }
        );
    }

    exportVinfast(ids: number[]) {
        return this.http.post(
            'http://localhost:8080/officer/vehicles/nhapkho/export-phu-luc-vinfast',
            { vehicleIds: ids },
            { responseType: 'blob' }
        );
    }

    getAllInvoices(): Observable<Invoice[]> {
        return this.http.get<Invoice[]>(
            `http://localhost:8080/officer/vehicle-invoice/findAll`
        );
    }

    /* ===== GUARANTEE ===== */
    getAllGuarantees(): Observable<GuaranteeLetter[]> {
        return this.http.get<GuaranteeLetter[]>(
            `http://localhost:8080/officer/guarantee-letters/findAll`
        );
    }
    // exportExcel(): Observable<Blob> {
    //     return this.http.get(
    //         `http://localhost:8080/officer/vehicles/export/excel`,
    //         { responseType: 'blob' }
    //     );
    // }
    updateVehicle(id: number, payload: any) {
        return this.http.put(
            `http://localhost:8080/officer/vehicles/${id}`,
            payload
        );
    }
}
