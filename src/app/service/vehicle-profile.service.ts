import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class VehicleProfileService {
    private readonly API_URL = 'http://localhost:3000/api/vehicle-profiles';

    constructor(private http: HttpClient) { }
    createVehicleProfile(payload: any): Observable<any> {
        return this.http.post(this.API_URL, payload);
    }
}