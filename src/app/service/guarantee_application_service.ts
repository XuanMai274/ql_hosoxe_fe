import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GuaranteeApplication } from '../models/guarantee_application.model';

@Injectable({
  providedIn: 'root'
})
export class GuaranteeApplicationService {

  private baseUrl = '/customer/guarantee-applications';

  constructor(private http: HttpClient) {}

  create(data: GuaranteeApplication): Observable<GuaranteeApplication> {
    return this.http.post<GuaranteeApplication>(this.baseUrl, data);
  }
}