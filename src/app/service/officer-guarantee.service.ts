import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { PageResponse } from '../models/page-response';
import { GuaranteeLetter } from '../models/guarantee_letter';

@Injectable({
    providedIn: 'root'
})
export class OfficerGuaranteeService {
    private readonly BASE_URL = 'http://localhost:8080/officer/guarantee-applications';

    // Dữ liệu giả lập để test giao diện
    private mockData: GuaranteeLetter[] = [
        {
            id: 101,
            customerDTO: { id: 1, customerName: 'Công ty TNHH MTV Vận tải Toàn Cầu', email: 'vantaitoancau@gmail.com' },
            manufacturerDTO: { id: 1, name: 'HYUNDAI', code: 'HYUNDAI', guaranteeRate: 0.01, templateCode: 'HY01' },
            expectedVehicleCount: 5,
            expectedGuaranteeAmount: 2500000000,
            saleContract: 'Hợp đồng mua bán số 123/HĐMB-2026',
            saleContractAmount: 3000000000,
            status: 'pending',
            createdAt: new Date().toISOString()
        },
        {
            id: 102,
            customerDTO: { id: 2, customerName: 'Tổng Công ty Xây dựng Trường Sơn', email: 'truongson_xd@vn.com' },
            manufacturerDTO: { id: 2, name: 'VINFAST', code: 'VINFAST', guaranteeRate: 0.015, templateCode: 'VF02' },
            expectedVehicleCount: 12,
            expectedGuaranteeAmount: 8400000000,
            saleContract: 'Hợp đồng cung cấp xe điện số VFT-TS-2026',
            saleContractAmount: 9500000000,
            status: 'pending',
            createdAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
            id: 103,
            customerDTO: { id: 3, customerName: 'Hợp tác xã Vận tải Thắng Lợi', email: 'thangloi_coop@gmail.com' },
            manufacturerDTO: { id: 1, name: 'HYUNDAI', code: 'HYUNDAI', guaranteeRate: 0.01, templateCode: 'HY01' },
            expectedVehicleCount: 2,
            expectedGuaranteeAmount: 1100000000,
            saleContract: 'Hợp đồng HTX-HY-001',
            saleContractAmount: 1200000000,
            status: 'approved',
            createdAt: new Date(Date.now() - 172800000).toISOString()
        }
    ];

    constructor(private http: HttpClient) { }

    /**
     * Lấy danh sách hồ sơ bảo lãnh mà khách hàng đã gửi (DỮ LIỆU GIẢ)
     */
    getGuaranteeApplications(page: number = 0, size: number = 10): Observable<PageResponse<GuaranteeLetter>> {
        const response: PageResponse<GuaranteeLetter> = {
            content: this.mockData,
            totalElements: this.mockData.length,
            totalPages: 1,
            size: size,
            number: page,
            first: true,
            last: true
        };
        return of(response).pipe(delay(500));
    }

    /**
     * Duyệt hồ sơ bảo lãnh (GIẢ LẬP)
     */
    approveApplication(id: number): Observable<any> {
        const app = this.mockData.find(a => a.id === id);
        if (app) app.status = 'approved';
        return of({ message: 'Success' }).pipe(delay(800));
    }

    /**
     * Từ chối hồ sơ bảo lãnh (GIẢ LẬP)
     */
    rejectApplication(id: number): Observable<any> {
        const app = this.mockData.find(a => a.id === id);
        if (app) app.status = 'rejected';
        return of({ message: 'Rejected' }).pipe(delay(800));
    }

    /**
     * Lấy chi tiết một đơn bảo lãnh theo ID (DỮ LIỆU GIẢ)
     */
    getApplicationById(id: number): Observable<GuaranteeLetter> {
        const app = this.mockData.find(a => a.id === id);
        return of(app as GuaranteeLetter).pipe(delay(300));
    }
}
