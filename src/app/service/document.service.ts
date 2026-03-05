import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DocumentVehicles } from '../models/document_vehicles';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DocumentService {
    private baseUrl = 'http://localhost:8080/officer/documents';

    constructor(private http: HttpClient) { }

    upload(files: File[], vehicleId: number) {
        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', file, file.name);
        });

        // vehicleId gửi dạng text
        formData.append('vehicleId', vehicleId.toString());

        return this.http.post<DocumentVehicles[]>(
            'http://localhost:8080/officer/documents/upload-multi',
            formData
        );
    }

    /* ================= UPLOAD MULTI ================= */

    /* ================= UPLOAD ================= */
    uploadFiles(files: File[], vehicleId?: number): Observable<DocumentVehicles[]> {

        const formData = new FormData();

        files.forEach(file => {
            formData.append('files', file);
        });

        if (vehicleId) {
            formData.append('vehicleId', vehicleId.toString());
        }

        return this.http.post<DocumentVehicles[]>(
            `${this.baseUrl}/upload-multi`,
            formData
        );
    }

    /* ================= GET BY VEHICLE ================= */
    // getByVehicle(vehicleId: number): Observable<DocumentVehicles[]> {

    //     return this.http.get<DocumentVehicles[]>(
    //         `${this.baseUrl}/vehicle/${vehicleId}`
    //     );
    // }

    /* ================= VIEW ================= */
    previewFile(documentId: number): Observable<Blob> {

        return this.http.get(
            `${this.baseUrl}/${documentId}/view`,
            { responseType: 'blob' }
        );
    }

    previewLatestDocCustomer(vehicleId: number): Observable<Blob> {
        return this.http.get(
            `http://localhost:8080/customer/documents/view`,
            {
                params: { vehicleId: vehicleId.toString() },
                responseType: 'blob'
            }
        );
    }

    /* ================= DOWNLOAD ================= */
    downloadFile(documentId: number): Observable<Blob> {

        return this.http.get(
            `${this.baseUrl}/${documentId}/view`,
            { responseType: 'blob' }
        );
    }

    /* ================= DELETE ================= */
    deleteFile(documentId: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/delete/${documentId}`);
    }

}
