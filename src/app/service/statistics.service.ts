import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GeneralStatistics } from '../models/general_statistics.model';

@Injectable({
    providedIn: 'root'
})
export class StatisticsService {
    private readonly BASE_URL = 'http://localhost:8080/api/statistics';

    constructor(private http: HttpClient) { }

    getGeneralStatistics(): Observable<GeneralStatistics> {
        return this.http.get<GeneralStatistics>(`${this.BASE_URL}/general`);
    }
}
