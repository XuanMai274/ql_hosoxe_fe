import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GuaranteeLetter } from '../models/guarantee_letter';
import { PageResponse } from '../models/page-response';
import { CreateInvoiceVehicleRequest } from '../models/createInvoice-vehicle-request';
import { Vehicle } from '../models/vehicle';
import { Invoice } from '../models/invoice-data.model';
@Injectable({ providedIn: 'root' })
export class VehicleInvoiceService {
  constructor(private http: HttpClient) { }

  create(request: CreateInvoiceVehicleRequest) {
    return this.http.post<CreateInvoiceVehicleRequest>(
      'http://localhost:8080/officer/vehicle-invoice/create',
      request
    );

  }

  ocr(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>('http://localhost:8080/officer/vehicle-invoice/ocr', formData);
  }

  extractPdf(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>('http://localhost:8080/officer/extract/pdf', formData);
  }

  extractExcel(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('excelFile', file);
    return this.http.post<any>('http://localhost:8080/officer/extract/excel', formData);
  }

  extractPdfMultiple(pdfFiles: File[], excelFile?: File | null): Observable<any> {
    const formData = new FormData();

    // Append MULTIPLE PDF files
    pdfFiles.forEach(pdf => {
      formData.append('files', pdf);
    });

    // Append Excel file if exists
    if (excelFile) {
      formData.append('excelFile', excelFile);
    }

    return this.http.post<any>('http://localhost:8080/officer/extract/pdf-multiple', formData);
  }

  extractHyundaiExcel(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>('http://localhost:8080/officer/extract/hyundai/excel', formData);
  }
}