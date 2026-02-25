import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GuaranteeLetter } from '../models/guarantee_letter';
import { PageResponse } from '../models/page-response';

@Injectable({
    providedIn: 'root'
})
export class CustomerGuaranteeService {

    private readonly BASE_URL = 'http://localhost:8080/customer';

    constructor(private http: HttpClient) { }

    /**
     * Lấy danh sách đơn hàng bảo lãnh của khách hàng hiện tại
     */
    getDonHangBaoLanh(
        manufacturerCode?: string,
        fromDate?: string,
        toDate?: string,
        page = 0,
        size = 20
    ): Observable<PageResponse<GuaranteeLetter>> {
        const params: any = { page, size };
        if (manufacturerCode) params.manufacturerCode = manufacturerCode;
        if (fromDate) params.fromDate = fromDate;
        if (toDate) params.toDate = toDate;
        return this.http.get<PageResponse<GuaranteeLetter>>(
            `${this.BASE_URL}/guarantee-letters`,
            { params }
        );
    }

    /**
     * Lấy tất cả đơn hàng (không phân trang) để tính tổng
     */
    getAllDonHangBaoLanh(): Observable<GuaranteeLetter[]> {
        return this.http.get<GuaranteeLetter[]>(
            `${this.BASE_URL}/guarantee-letters/all`
        );
    }
}
