import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { WarehouseExportDTO } from '../models/warehouseExport.model';

@Injectable({
    providedIn: 'root'
})
export class WarehouseExportService {
    private baseUrl = 'http://localhost:8080/officer/warehouse-export';
    private vehicleUrl = 'http://localhost:8080/officer/vehicles/warehouse-export';
    private customerUrl = 'http://localhost:8080/customer/vehicles/available-for-export';

    constructor(private http: HttpClient) { }

    getPendingRequests(): Observable<WarehouseExportDTO[]> {
        return this.http.get<WarehouseExportDTO[]>(`${this.baseUrl}/pending`);
    }

    getVehiclesByExportId(exportId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.vehicleUrl}/${exportId}`);
    }

    rejectRequest(id: number): Observable<any> {
        return this.http.post(`${this.baseUrl}/reject/${id}`, {});
    }

    getAvailableForExport(status: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.customerUrl}/${status}`);
    }
    approveExport(dto: WarehouseExportDTO) {
        return this.http.post<WarehouseExportDTO>(
            'http://localhost:8080/officer/warehouse-export/approve',
            dto
        );
    }

    exportAllFiles(dto: WarehouseExportDTO) {
        return this.http.post(
            'http://localhost:8080/officer/warehouse-export-files/export-all',
            dto,
            { responseType: 'blob' }
        );
    }
}
