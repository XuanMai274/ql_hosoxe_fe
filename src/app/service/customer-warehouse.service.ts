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
     * Lấy danh sách khoản vay (giải ngân) của khách hàng đang đăng nhập
     */
    getMyLoans(): Observable<LoanDTO[]> {
        return this.http.get<LoanDTO[]>(`${this.BASE_URL}/loans`);
    }

    /**
     * Lấy chi tiết khoản vay theo ID
     */
    getLoanDetail(id: number): Observable<LoanDTO> {
        return this.http.get<LoanDTO>(`${this.BASE_URL}/loans/${id}`);
    }
}
