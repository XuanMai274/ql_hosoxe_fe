import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WarehouseImportDTO } from '../models/warehouseImport.model';
import { LoanDTO } from '../models/loan.model';

@Injectable({
    providedIn: 'root'
})
export class CustomerWarehouseService {

    private readonly BASE_URL = 'http://localhost:8080/customer';

    constructor(private http: HttpClient) { }

    // ===== ĐỀ NGHỊ NHẬP KHO =====

    /**
     * Lấy danh sách phiếu nhập kho của khách hàng đang đăng nhập
     */
    getMyWarehouseImports(): Observable<WarehouseImportDTO[]> {
        return this.http.get<WarehouseImportDTO[]>(`${this.BASE_URL}/warehouse-imports`);
    }

    /**
     * Lấy chi tiết phiếu nhập kho (bao gồm danh sách xe)
     */
    getWarehouseImportDetail(id: number): Observable<WarehouseImportDTO> {
        return this.http.get<WarehouseImportDTO>(`${this.BASE_URL}/warehouse-imports/${id}`);
    }

    // ===== ĐỀ NGHỊ GIẢI NGÂN =====

    /**
     * Lấy danh sách đợt giải ngân của khách hàng đang đăng nhập
     */
    getMyDisbursements(): Observable<any[]> {
        return this.http.get<any[]>(`${this.BASE_URL}/disbursements`);
    }

    /**
     * Lấy chi tiết đợt giải ngân theo ID
     */
    getDisbursementDetail(id: number): Observable<any> {
        return this.http.get<any>(`${this.BASE_URL}/disbursements/${id}`);
    }
}
