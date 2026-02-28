import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WarehouseImportDTO } from '../models/warehouseImport.model';
import { LoanDTO } from '../models/loan.model';
import { Vehicle } from '../models/vehicle';
import { WarehouseExportDTO } from '../models/warehouseExport.model';

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

    // ===== ĐỀ NGHỊ RÚT HỒ SƠ (XUẤT KHO) =====

    /**
     * Lấy danh sách xe theo trạng thái (ví dụ: "Giữ trong kho")
     */
    getVehiclesByStatus(status: string): Observable<Vehicle[]> {
        return this.http.get<Vehicle[]>(`${this.BASE_URL}/vehicles/status/${status}`);
    }

    /**
     * Lấy danh sách xe sẵn sàng để rút (đã lọc bỏ những xe đang nằm trong đơn chờ duyệt khác)
     */
    getAvailableForExport(status: string, page: number = 0, size: number = 10, chassis?: string, manufacturer?: string, ref?: string): Observable<any> {
        let url = `${this.BASE_URL}/vehicles/available-for-export/${status}?page=${page}&size=${size}`;
        if (chassis) url += `&chassisNumber=${chassis}`;
        if (manufacturer) url += `&manufacturer=${manufacturer}`;
        if (ref) url += `&ref=${ref}`;
        return this.http.get<any>(url);
    }


    /**
     * Gửi yêu cầu rút hồ sơ xe
     */
    requestExport(dto: WarehouseExportDTO): Observable<WarehouseExportDTO> {
        return this.http.post<WarehouseExportDTO>(`${this.BASE_URL}/warehouse-export/request`, dto);
    }
}
