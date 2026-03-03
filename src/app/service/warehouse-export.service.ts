import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { WarehouseExportDTO } from '../models/warehouseExport.model';
import { DisbursementDTO } from '../models/disbursement.model';

@Injectable({
    providedIn: 'root'
})
export class WarehouseExportService {
    private baseUrl = 'http://localhost:8080/officer/warehouse-export';
    private vehicleUrl = 'http://localhost:8080/officer/vehicles/warehouse-export';
    private customerUrl = 'http://localhost:8080/customer';

    constructor(private http: HttpClient) { }

    getPendingRequests(): Observable<WarehouseExportDTO[]> {
        return this.http.get<WarehouseExportDTO[]>(`${this.baseUrl}/pending`);
    }

    getVehiclesByExportId(exportId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.vehicleUrl}/${exportId}`);
    }
    getVehiclesByExportIdForCustomer(exportId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.customerUrl}/vehicles/warehouse-export/${exportId}`);
    }

    rejectRequest(id: number): Observable<any> {
        return this.http.post(`${this.baseUrl}/reject/${id}`, {});
    }

    getAvailableForExport(status: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.customerUrl}/vehicles/available-for-export/${status}`);
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
    checkDisbursementNeedInterest(loanIds: number[]) {
        return this.http.post<DisbursementDTO[]>(
            `http://localhost:8080/officer/disbursements/check-paidOff`,
            loanIds
        );
    }

    updateInterestForDisbursements(
        payload: { disbursementId: number; interestAmount: number }[]
    ) {
        return this.http.post<void>(
            `http://localhost:8080/officer/disbursements/update-interest`,
            payload
        );
    }

}
