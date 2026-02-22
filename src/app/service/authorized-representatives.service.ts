import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Invoice } from '../models/invoice-data.model';
import { Guarantee } from '../models/guarantee.model';
import { BranchAuthorizedRepresentative } from '../models/branch-authorized-representative';
@Injectable({
    providedIn: 'root'
})
export class AuthorizedRepresentativesService {
    private readonly API_URL = 'http://localhost:8080/officer/branch-authorized-representatives/findAll';

    constructor(private http: HttpClient) { }
    getAuthorizedRepresentatives(): Observable<BranchAuthorizedRepresentative[]> {
        return this.http
            .get<any>(`${this.API_URL}`)
            .pipe(
                map(res => {
                    if (res?.success && Array.isArray(res.branchAuthorizedRepresentative)) {
                        return res.branchAuthorizedRepresentative as BranchAuthorizedRepresentative[];
                    }
                    return [];
                })
            );
    }
    addRepresentative(data: any) {
        return this.http.post(
            'http://localhost:8080/officer/branch-authorized-representatives/add',
            data
        );
    }
}