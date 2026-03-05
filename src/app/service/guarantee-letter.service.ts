import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GuaranteeLetter } from '../models/guarantee_letter';
import { PageResponse } from '../models/page-response';
import { XuatThuBaoLanh } from '../models/xuat-thu-bao-lanh';
import { ExportDeXuatRequest } from '../models/export_de_xuat_request';
import { GuaranteeLetterFile } from '../models/guarantee_letter_file';

@Injectable({
    providedIn: 'root'
})
export class GuaranteeLetterService {

    private readonly API_URL = 'http://localhost:8080/officer/guarantee-export-letters/export';

    constructor(private http: HttpClient) { }

    /**
     * Xem trước thư bảo lãnh (Word)
     */
    preview(dto: GuaranteeLetter): Observable<Blob> {
        return this.http.post(
            `http://localhost:8080/officer/guarantee-export-letters/preview`,
            dto,
            { responseType: 'blob' }
        );
    }
    uploadFile(guaranteeId: number, file: File): Observable<GuaranteeLetterFile> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('guaranteeLetterId', guaranteeId.toString());
        return this.http.post<GuaranteeLetterFile>(
            `http://localhost:8080/officer/guarantee-files/upload`,
            formData
        );
    }

    downloadFile(fileId: number) {
        return this.http.get(`http://localhost:8080/officer/guarantee-files/${fileId}/download`, {
            responseType: 'blob'
        });
    }
    // xem trước thư bảo alnxh pdf
    previewPdf(fileId: number) {
        return this.http.get(`http://localhost:8080/officer/guarantee-files/${fileId}/view`, {
            responseType: 'blob'
        });
    }
    previewPdfCustomer(fileId: number) {
        return this.http.get(`http://localhost:8080/customer/guarantee-files/${fileId}/view`, {
            responseType: 'blob'
        });
    }
    // xóa file thư bảo lãnh
    deleteFile(fileId: number) {
        return this.http.delete(
            `http://localhost:8080/officer/guarantee-files/${fileId}`
        );
    }
    /**
     * Xuất file Word thư bảo lãnh
     */
    export(dto: GuaranteeLetter,
        template: string): Observable<Blob> {

        return this.http.post(
            'http://localhost:8080/officer/guarantee-export-letters/export/thu-bao-lanh',
            dto,
            {
                params: { template },
                responseType: 'blob'
            }
        );

    }
    // export(dto: GuaranteeLetter, template: string): Observable<Blob> {
    //     return this.http.post(
    //         'http://localhost:8080/officer/guarantee-export-letters/export/thu-bao-lanh',
    //         dto,
    //         {
    //             params: { template },
    //             responseType: 'blob'
    //         }
    //     );
    // }
    exportDeXuatCapBaoLanh(
        request: ExportDeXuatRequest,
        template: string
    ): Observable<Blob> {

        return this.http.post(
            'http://localhost:8080/officer/guarantee-export-letters/export/de-xuat-cap-bao-lanh',
            request,
            {
                params: { template },
                responseType: 'blob'
            }
        );
    }
    exportPhanXetDuyet(
        request: ExportDeXuatRequest,
        template: string
    ): Observable<Blob> {

        return this.http.post(
            'http://localhost:8080/officer/guarantee-export-letters/export/phan-xet-duyet',
            request,
            {
                params: { template },
                responseType: 'blob'
            }
        );
    }
    // exportPhanXetDuyet(dto: GuaranteeLetter, template: string): Observable<Blob> {
    //     return this.http.post(
    //         'http://localhost:8080/officer/guarantee-export-letters/export/phan-xet-duyet',
    //         dto,
    //         {
    //             params: { template },
    //             responseType: 'blob'
    //         }
    //     );
    // }
    exportPhanYKien(dto: GuaranteeLetter, template: string): Observable<Blob> {
        return this.http.post(
            'http://localhost:8080/officer/guarantee-export-letters/export/phan-y_kien',
            dto,
            {
                params: { template },
                responseType: 'blob'
            }
        );
    }

    // getGuaranteeLetters(
    //     manufacturerCode?: string,
    //     fromDate?: string,
    //     toDate?: string,
    //     page: number = 0,
    //     size: number = 10
    // ): Observable<PageResponse<GuaranteeLetter>> {

    //     let params: any = {
    //         page,
    //         size
    //     };

    //     if (manufacturerCode) params.manufacturerCode = manufacturerCode;
    //     if (fromDate) params.fromDate = fromDate;
    //     if (toDate) params.toDate = toDate;

    //     return this.http.get<PageResponse<GuaranteeLetter>>(
    //         'http://localhost:8080/officer/guarantee-letters/findByDate',
    //         { params }
    //     );
    // }
    search(
        keyword?: string,
        manufacturerCode?: string,
        fromDate?: string,
        toDate?: string,
        hasLetterNumber?: boolean,
        page = 0,
        size = 10
    ) {
        const params: any = { page, size };
        if (keyword) params.keyword = keyword;
        if (manufacturerCode) params.manufacturerCode = manufacturerCode;
        if (fromDate) params.fromDate = fromDate;
        if (toDate) params.toDate = toDate;
        if (hasLetterNumber !== undefined) params.hasLetterNumber = hasLetterNumber;
        return this.http.get<PageResponse<GuaranteeLetter>>(
            'http://localhost:8080/officer/guarantee-letters/search',
            { params }
        );
    }
    updateGuaranteeLetter(id: number, dto: GuaranteeLetter): Observable<GuaranteeLetter> {
        return this.http.put<GuaranteeLetter>(
            `http://localhost:8080/officer/guarantee-letters/${id}`,
            dto
        );
    }
    getById(id: number): Observable<GuaranteeLetter> {
        return this.http.get<GuaranteeLetter>(
            `http://localhost:8080/officer/guarantee-letters/${id}`
        );
    }
    suggest(keyword: string, manufacturerCode: string) {
        return this.http.get<any[]>(
            `http://localhost:8080/officer/guarantee-letters/suggest`,
            {
                params: {
                    keyword,
                    manufacturerCode
                }
            }
        );
    }

    getActiveGuaranteesForCustomer(page = 0, size = 10): Observable<PageResponse<GuaranteeLetter>> {
        return this.http.get<PageResponse<GuaranteeLetter>>(
            `http://localhost:8080/customer/guarantee-letters/active`,
            { params: { page, size } }
        );
    }

}