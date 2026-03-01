import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { LoanDTO } from '../models/loan.model';
import { PageResponse } from '../models/page-response';

@Injectable({
    providedIn: 'root'
})
export class CustomerLoanService {

    private readonly BASE_URL = 'http://localhost:8080/customer/loans';

    constructor(private http: HttpClient) { }

    /**
     * Lấy danh sách khoản vay của khách hàng hiện tại (phân trang + lọc)
     */
    getLoans(
        page: number,
        size: number,
        loanContractNumber?: string,
        chassisNumber?: string,
        status?: string,
        docId?: string,
        dueInDays?: number
    ): Observable<PageResponse<LoanDTO>> {

        let params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        if (loanContractNumber) params = params.set('loanContractNumber', loanContractNumber);
        if (chassisNumber) params = params.set('chassisNumber', chassisNumber);
        if (status) params = params.set('status', status);
        if (docId) params = params.set('docId', docId);
        if (dueInDays !== undefined && dueInDays !== null) {
            params = params.set('dueInDays', dueInDays.toString());
        }

        return this.http.get<PageResponse<LoanDTO>>(this.BASE_URL, { params });
    }

    /**
     * Lấy chi tiết khoản vay
     */
    getLoanDetail(id: number): Observable<LoanDTO> {
        return this.http.get<LoanDTO>(`${this.BASE_URL}/${id}`);
    }
}
