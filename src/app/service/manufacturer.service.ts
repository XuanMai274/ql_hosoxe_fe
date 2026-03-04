import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Invoice } from '../models/invoice-data.model';
import { Guarantee } from '../models/guarantee.model';
import { Manufacturer } from '../models/manufacturer';
import { BranchAuthorizedRepresentative } from '../models/branch-authorized-representative';
@Injectable({
    providedIn: 'root'
})
export class ManufacturerService {
    private readonly API_URL = 'http://localhost:8080/officer/manufacturer';

    constructor(private http: HttpClient) { }
    getManufacture(): Observable<Manufacturer[]> {
        return this.http
            .get<any>(`${this.API_URL}/findAll`)
            .pipe(
                map(res => {
                    if (res?.success && Array.isArray(res.manufacturerDTO)) {
                        return res.manufacturerDTO as Manufacturer[];
                    }
                    return [];
                })
            );
    }
    getManufactureCustomer(): Observable<Manufacturer[]> {
        return this.http
            .get<any>(`http://localhost:8080/customer/manufacturer/findAll`)
            .pipe(
                map(res => {
                    if (res?.success && Array.isArray(res.manufacturerDTO)) {
                        return res.manufacturerDTO as Manufacturer[];
                    }
                    return [];
                })
            );
    }
    getByCode(code: string): Observable<Manufacturer> {
        return this.http.get<Manufacturer>(`http://localhost:8080/officer/manufacturer/code/${code}`);
    }
    getById(id: number): Observable<Manufacturer> {
        return this.http.get<Manufacturer>(`${this.API_URL}/${id}`);
    }
    add(dto: Manufacturer): Observable<Manufacturer> {
        return this.http.post<Manufacturer>(`${this.API_URL}/add`, dto);
    }
    update(id: number, dto: Manufacturer): Observable<Manufacturer> {
        return this.http.put<Manufacturer>(`${this.API_URL}/${id}`, dto);
    }

    uploadLogo(file: File): Observable<any> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<any>(`${this.API_URL}/upload-logo`, formData);
    }
}