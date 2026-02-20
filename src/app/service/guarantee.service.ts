import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Invoice } from '../models/invoice-data.model';
import { Guarantee } from '../models/guarantee.model';
import { GuaranteeLetter } from '../models/guarantee_letter';
@Injectable({
    providedIn: 'root'
})
export class GuaranteeService {

    private readonly API_URL = 'http://localhost:8080/officer/guarantee-letters';

    constructor(private http: HttpClient) { }

    // ✅ LƯU & NHẬN LẠI ĐỐI TƯỢNG BẢO LÃNH THỰC
    createGuarantee(
        guarantee: GuaranteeLetter
    ): Observable<GuaranteeLetter> {
        return this.http.post<GuaranteeLetter>(
            `${this.API_URL}/add`,
            guarantee
        );
    }
}