import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LoanDTO } from '../models/loan.model';
import { PageResponse } from '../models/page-response';

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

    if (loanContractNumber) {
      params = params.set('loanContractNumber', loanContractNumber);
    }

    if (chassisNumber) {
      params = params.set('chassisNumber', chassisNumber);
    }

    if (status) {
      params = params.set('status', status);
    }

    if (docId) {
      params = params.set('docId', docId);
    }

    if (dueInDays !== undefined && dueInDays !== null) {
      params = params.set('dueInDays', dueInDays.toString());
    }

    return this.http.get<PageResponse<LoanDTO>>(this.apiUrl, { params });
  }
  getDetail(id: number): Observable<LoanDTO> {
    return this.http.get<LoanDTO>(`${this.apiUrl}/${id}`);
  }

  updateLoan(id: number, dto: LoanDTO): Observable<LoanDTO> {
    return this.http.put<LoanDTO>(`${this.apiUrl}/${id}`, dto);
  }

  /** PATCH - Chỉ cập nhật trường cơ bản, không tính lại balance */
  patchLoan(id: number, dto: Partial<LoanDTO>): Observable<LoanDTO> {
    return this.http.patch<LoanDTO>(`${this.apiUrl}/${id}`, dto);
  }
}
