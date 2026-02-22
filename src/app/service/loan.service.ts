import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LoanDTO } from '../models/loan.model';

@Injectable({
  providedIn: 'root'
})
export class LoanService {

  private apiUrl = 'http://localhost:8080/officer/loans';

  constructor(private http: HttpClient) { }

  // ===== CREATE 1 LOAN =====
  createLoan(dto: LoanDTO): Observable<LoanDTO> {
    return this.http.post<LoanDTO>(this.apiUrl, dto);
  }

  // ===== CREATE BATCH =====
  createBatchLoans(dtos: LoanDTO[]): Observable<LoanDTO[]> {
    return this.http.post<LoanDTO[]>(`${this.apiUrl}/batch`, dtos);
  }

  // ===== GET BY ID =====
  getLoanById(id: number): Observable<LoanDTO> {
    return this.http.get<LoanDTO>(`${this.apiUrl}/${id}`);
  }

  // ===== GET ALL =====
  getAll(): Observable<LoanDTO[]> {
    return this.http.get<LoanDTO[]>(this.apiUrl);
  }
}