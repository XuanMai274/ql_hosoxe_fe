import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PageResponse } from '../models/page-response';
import { GuaranteeLetter } from '../models/guarantee_letter';

@Injectable({
    providedIn: 'root'
})
export class OfficerGuaranteeService {
    private readonly BASE_URL = 'http://localhost:8080/officer/guarantee-applications';

    constructor(private http: HttpClient) { }

    /**
     * Lấy danh sách hồ sơ bảo lãnh mà khách hàng đã gửi
     */
    getGuaranteeApplications(page: number = 0, size: number = 10): Observable<PageResponse<GuaranteeLetter>> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());
        return this.http.get<PageResponse<GuaranteeLetter>>(this.BASE_URL, { params });
    }

    /**
     * Duyệt hồ sơ bảo lãnh
     */
    approveApplication(id: number): Observable<any> {
        return this.http.post(`${this.BASE_URL}/${id}/approve`, {});
    }

    /**
     * Từ chối hồ sơ bảo lãnh
     */
    rejectApplication(id: number): Observable<any> {
        return this.http.post(`${this.BASE_URL}/${id}/reject`, {});
    }

    /**
     * Lấy chi tiết một đơn bảo lãnh theo ID
     */
    getApplicationById(id: number): Observable<GuaranteeLetter> {
        return this.http.get<GuaranteeLetter>(`${this.BASE_URL}/${id}`);
    }
}

