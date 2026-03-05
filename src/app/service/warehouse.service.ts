import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { WarehouseImportDTO } from '../models/warehouseImport.model';
import { FullProcessNKGNRequest } from '../models/full-processNKGN-request';
import { FullProcessResponse } from '../models/full-process-response';
import { Vehicle } from '../models/vehicle';

export interface WarehouseImportRequestDTO {
    vehicleIds: number[];
}

@Injectable({
    providedIn: 'root'
})
export class WarehouseService {

    private baseUrl = 'http://localhost:8080/officer/warehouse';

    constructor(private http: HttpClient) { }

    importWarehouse(warehouseImportDTO: WarehouseImportRequestDTO): Observable<WarehouseImportDTO> {
        return this.http.post<WarehouseImportDTO>(
            `${this.baseUrl}/import`,
            warehouseImportDTO
        );
    }

    getAll(params: any): Observable<any> {
        return this.http.get<any>(`${this.baseUrl}/all`, { params });
    }

    getById(id: number): Observable<WarehouseImportDTO> {
        return this.http.get<WarehouseImportDTO>(`${this.baseUrl}/${id}`);
    }

    update(id: number, dto: any): Observable<WarehouseImportDTO> {
        return this.http.put<WarehouseImportDTO>(`${this.baseUrl}/${id}`, dto);
    }
    executeFullProcess(
        request: FullProcessNKGNRequest
    ): Observable<FullProcessResponse> {
        return this.http.post<FullProcessResponse>(
            `${this.baseUrl}/full-process`,
            request
        );
    }
    
}