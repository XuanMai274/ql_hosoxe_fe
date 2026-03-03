import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PageResponse } from '../models/page-response';
import { GuaranteeApplication } from '../models/guarantee_application.model';
import { GuaranteeStatistics } from '../models/guarantee_statistics.model';

@Injectable({
    providedIn: 'root'
})
export class OfficerGuaranteeService {
    private readonly BASE_URL = 'http://localhost:8080/officer/guarantee-applications';

    constructor(private http: HttpClient) { }

    /**
     * Lấy danh sách hồ sơ bảo lãnh mà khách hàng đã gửi
     */
    getGuaranteeApplications(page: number = 0, size: number = 10): Observable<PageResponse<GuaranteeApplication>> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());
        return this.http.get<PageResponse<GuaranteeApplication>>(this.BASE_URL, { params });
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
    getApplicationById(id: number): Observable<GuaranteeApplication> {
        return this.http.get<GuaranteeApplication>(`${this.BASE_URL}/${id}`);
    }

    /**
     * Lấy thống kê tổng quan
     */
    getStatistics(): Observable<GuaranteeStatistics> {
        return this.http.get<GuaranteeStatistics>(`${this.BASE_URL}/statistics`);
    }
}

