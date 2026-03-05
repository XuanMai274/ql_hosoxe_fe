import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GuaranteeApplication } from '../models/guarantee_application.model';
import { PageResponse } from '../models/page-response';

@Injectable({
  providedIn: 'root'
})
export class GuaranteeApplicationService {

  private readonly baseUrl = 'http://localhost:8080/customer/guarantee-applications';

  constructor(private http: HttpClient) { }

  /**
   * Lấy danh sách đề nghị cấp bảo lãnh (phân trang + lọc)
   */
  getList(
    manufacturerId?: number,
    fromDate?: string,
    toDate?: string,
    status?: string,
    page = 0,
    size = 20
  ): Observable<PageResponse<GuaranteeApplication>> {
    const params: any = { page, size };
    if (manufacturerId) params.manufacturerId = manufacturerId;
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;
    if (status) params.status = status;

    return this.http.get<PageResponse<GuaranteeApplication>>(this.baseUrl, { params });
  }

  exportDeNghi(id: number) {
    return this.http.get(
      `/customer/guarantee-export/de-nghi/${id}`,
      { responseType: 'blob' }
    );
  }

  exportDanhSachXe(id: number) {
    return this.http.get(
      `/customer/guarantee-export/danh-sach-xe/${id}`,
      { responseType: 'blob' }
    );
  }
  exportAll(id: number) {
    return this.http.get(
      `http://localhost:8080/customer/guarantee-export/export-all/${id}`,
      {
        responseType: 'blob'
      }
    );
  }

  /**
   * Xem chi tiết một đề nghị bảo lãnh
   */
  getById(id: number): Observable<GuaranteeApplication> {
    return this.http.get<GuaranteeApplication>(`${this.baseUrl}/${id}`);
  }

  /**
   * Tạo mới đề nghị bảo lãnh
   */
  create(data: any): Observable<GuaranteeApplication> {
    return this.http.post<GuaranteeApplication>(this.baseUrl, data);
  }

  /**
   * Cập nhật đề nghị bảo lãnh
   */
  update(id: number, data: any): Observable<GuaranteeApplication> {
    return this.http.put<GuaranteeApplication>(`${this.baseUrl}/${id}`, data);
  }
}