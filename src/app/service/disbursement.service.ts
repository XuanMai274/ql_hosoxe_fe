import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DisbursementDTO } from '../models/disbursement.model';

@Injectable({
    providedIn: 'root'
})
export class DisbursementService {

    private apiUrl = 'http://localhost:8080/officer/disbursements';

    constructor(private http: HttpClient) { }

    previewDisbursement(customerId: number):
    
        Observable<DisbursementDTO> {
        
        return this.http.get<DisbursementDTO>(
            `${this.apiUrl}/preview/${customerId}`
        );
    }

    createDisbursement(dto: DisbursementDTO): Observable<DisbursementDTO> {
    return this.http.post<DisbursementDTO>(this.apiUrl, dto);
  }
}
