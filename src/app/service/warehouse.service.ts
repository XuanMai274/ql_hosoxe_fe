import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { WarehouseImportDTO } from '../models/warehouseImport.model';

export interface WarehouseImportRequestDTO {
    vehicleIds: number[];
}

@Injectable({
    providedIn: 'root'
})
export class WarehouseService {

    private baseUrl = 'http://localhost:8080/officer/warehouse';

    constructor(private http: HttpClient) { }

    importWarehouse(vehicleIds: number[]): Observable<WarehouseImportDTO> {

        const payload: WarehouseImportRequestDTO = {
            vehicleIds: vehicleIds
        };
        return this.http.post<WarehouseImportDTO>(
            `${this.baseUrl}/import`,
            payload
        );
    }
}