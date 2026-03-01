import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WarehouseImportDTO } from '../models/warehouseImport.model';
import { PageResponse } from '../models/page-response';
import { LoanDTO } from '../models/loan.model';

@Injectable({
    providedIn: 'root'
})
export class CustomerWarehouseService {

    private readonly BASE_URL = 'http://localhost:8080/customer';

    constructor(private http: HttpClient) { }

    // ===== ĐỀ NGHỊ NHẬP KHO =====

    /**
     * Lấy danh sách phiếu nhập kho của khách hàng đang đăng nhập (phân trang)
     */
    getMyWarehouseImports(page: number = 0, size: number = 10): Observable<PageResponse<WarehouseImportDTO>> {
        return this.http.get<PageResponse<WarehouseImportDTO>>(`${this.BASE_URL}/warehouse-imports?page=${page}&size=${size}`);
    }

    /**
     * Lấy chi tiết phiếu nhập kho (bao gồm danh sách xe)
     */
    getWarehouseImportDetail(id: number): Observable<WarehouseImportDTO> {
        return this.http.get<WarehouseImportDTO>(`${this.BASE_URL}/warehouse-imports/${id}`);
    }

    // ===== ĐỀ NGHỊ GIẢI NGÂN =====

    /**
     * Lấy danh sách đợt giải ngân của khách hàng đang đăng nhập (phân trang)
     */
    getMyDisbursements(page: number = 0, size: number = 10): Observable<PageResponse<any>> {
        return this.http.get<PageResponse<any>>(`${this.BASE_URL}/disbursements?page=${page}&size=${size}`);
    }

    /**
     * Lấy chi tiết đợt giải ngân theo ID
     */
    getDisbursementDetail(id: number): Observable<any> {
        return this.http.get<any>(`${this.BASE_URL}/disbursements/${id}`);
    }
}
