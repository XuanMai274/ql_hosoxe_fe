import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DisbursementDTO } from '../models/disbursement.model';
import { PageResponse } from '../models/page-response';

@Injectable({
    providedIn: 'root'
})
export class DisbursementService {

    private apiUrl = 'http://localhost:8080/officer/disbursements';

    constructor(private http: HttpClient) { }

    previewDisbursement(): Observable<DisbursementDTO> {
        return this.http.get<DisbursementDTO>(`${this.apiUrl}/preview`);
    }

    createDisbursement(dto: DisbursementDTO): Observable<DisbursementDTO> {
        return this.http.post<DisbursementDTO>(this.apiUrl, dto);
    }

    getDisbursements(
        page: number = 0,
        size: number = 10,
        loanContractNumber?: string,
        fromDate?: string,
        toDate?: string
    ): Observable<PageResponse<DisbursementDTO>> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        if (loanContractNumber) params = params.set('loanContractNumber', loanContractNumber);
        if (fromDate) params = params.set('disbursementDateFrom', fromDate);
        if (toDate) params = params.set('disbursementDateTo', toDate);

        return this.http.get<PageResponse<DisbursementDTO>>(`${this.apiUrl}/search`, { params });
    }

    getDetail(id: number): Observable<DisbursementDTO> {
        return this.http.get<DisbursementDTO>(`${this.apiUrl}/${id}`);
    }

    updateDisbursement(id: number, dto: DisbursementDTO): Observable<DisbursementDTO> {
        return this.http.put<DisbursementDTO>(`${this.apiUrl}/${id}`, dto);
    }
}
