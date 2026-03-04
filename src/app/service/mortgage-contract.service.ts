import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MortgageContract } from '../models/mortgage-contract.model';

@Injectable({
    providedIn: 'root'
})
export class MortgageContractService {
    private readonly API_URL = 'http://localhost:8080/officer/mortgage-contracts';

    constructor(private http: HttpClient) { }

    getMortgageContracts(): Observable<MortgageContract[]> {
        return this.http.get<MortgageContract[]>(this.API_URL);
    }

    addMortgageContract(contract: MortgageContract): Observable<MortgageContract> {
        return this.http.post<MortgageContract>(this.API_URL, contract);
    }

    updateMortgageContract(id: number, contract: MortgageContract): Observable<MortgageContract> {
        return this.http.put<MortgageContract>(`${this.API_URL}/${id}`, contract);
    }

    getMortgageContractById(id: number): Observable<MortgageContract> {
        return this.http.get<MortgageContract>(`${this.API_URL}/${id}`);
    }

    deleteMortgageContract(id: number): Observable<void> {
        return this.http.delete<void>(`${this.API_URL}/${id}`);
    }
}
