import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Invoice } from '../models/invoice-data.model';
@Injectable({
    providedIn: 'root'
})
export class InvoiceService {
    private readonly API_URL = 'http://localhost:8080/add/invoice';

    constructor(private http: HttpClient) { }
    createInvoice(invoice: Invoice): Observable<Invoice> {
        return this.http.post<Invoice>(`http://localhost:8080/add/invoice`, invoice);
    }
}