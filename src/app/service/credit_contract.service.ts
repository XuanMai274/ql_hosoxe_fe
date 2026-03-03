import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Invoice } from '../models/invoice-data.model';
import { Guarantee } from '../models/guarantee.model';
import { CreditContract } from '../models/credit_contract';
@Injectable({
    providedIn: 'root'
})
export class CreditContractService {
    private readonly API_URL = 'http://localhost:8080/officer/credit-contract';

    constructor(private http: HttpClient) { }
    getCreditContracts(): Observable<CreditContract[]> {
        return this.http
            .get<any>(`${this.API_URL}/findAll`)
            .pipe(
                map(res => {
                    if (res?.success && Array.isArray(res.creditContract)) {
                        return res.creditContract as CreditContract[];
                    }
                    return [];
                })
            );
    }

    addCreditContract(contract: CreditContract): Observable<any> {
        return this.http.post<any>(`${this.API_URL}/add`, contract);
    }

    updateCreditContract(id: number, contract: CreditContract): Observable<any> {
        return this.http.put<any>(`${this.API_URL}/update/${id}`, contract);
    }

    getCreditContractById(id: number): Observable<CreditContract> {
        return this.http.get<any>(`${this.API_URL}/${id}`).pipe(
            map(res => {
                if (res?.success && res.creditContract) {
                    return res.creditContract as CreditContract;
                }
                return res as CreditContract;
            })
        );
    }
}