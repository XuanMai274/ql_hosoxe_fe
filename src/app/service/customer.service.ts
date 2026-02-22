import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Invoice } from '../models/invoice-data.model';
import { Guarantee } from '../models/guarantee.model';
import { BranchAuthorizedRepresentative } from '../models/branch-authorized-representative';
import { Customer } from '../models/customer.model';
@Injectable({
    providedIn: 'root'
})
export class CustomerService {

    constructor(private http: HttpClient) { }
    private baseUrl = 'http://localhost:8080';


    getCustomers(): Observable<Customer[]> {
        return this.http.get<Customer[]>(
            `${this.baseUrl}/officer/customers`
        );
    }
}