import { Component, InjectionToken } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map, Observable, tap, throwError } from 'rxjs';
import { Injectable } from '@angular/core';
import { AuthenticationResponse } from '../../models/authentication-response.model';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode'; // Ensure correct import for v4

export const AUTH_SERVICE = new InjectionToken<AuthServiceComponent>('AUTH_SERVICE');
@Injectable({ // cung cấp provider để angular biết và inject nó vào các componet khác
    providedIn: 'root'// tạo instance của service này và chia sẽ cho toàn bộ ứng dụng
})

export class AuthServiceComponent {

    private apiUrl = 'http://localhost:8080/api/auth/login';

    constructor(private http: HttpClient, private router: Router) { }

    login(credentials: { username: string; password: string }): Observable<any> {
        return this.http.post<AuthenticationResponse>(this.apiUrl, credentials)
            .pipe(
                catchError((error: HttpErrorResponse) => {
                    return throwError(() => error);
                })
            );
    }
    // refresh token
    refreshToken(): Observable<AuthenticationResponse> {
        const token = sessionStorage.getItem('accessToken');
        return this.http.post<AuthenticationResponse>(`http://localhost:8080/api/auth/refreshToken`, {}, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Authorization-Refresh': sessionStorage.getItem('refreshToken') || ''
            }
        });
    }

    // đăng xuất
    logout() {
        this.http.post('http://localhost:8080/api/auth/logout', {}).subscribe({
            next: () => {
                this.finalizeLogout();
            },
            error: () => {
                // Vẫn thực hiện logout ở client ngay cả khi gọi API lỗi
                this.finalizeLogout();
            }
        });
    }

    private finalizeLogout() {
        sessionStorage.removeItem("accessToken");
        sessionStorage.removeItem("refreshToken");
        console.log("đã đăng xuất");
        this.router.navigate(["/login"]);
    }
    // hàm kiểm tra người dùng đã đăng nhập chưa
    isAuthenticate(): boolean {
        // lấy token nếu có thì đã đăng nhập    
        const token = sessionStorage.getItem("accessToken");
        if (token !== null) {
            return true;
        } else {
            return false;
        }
    }
    // lấy role từ token để kiểm tra 
    getUserRole(): String {
        const token = sessionStorage.getItem("accessToken");
        if (!token) {
            return "";
        }
        try {
            const decodeToken: any = jwtDecode(token);
            return decodeToken.role || "";
        } catch {
            console.error('Lỗi khi giải mã token:', Error);
            return '';
        }
    }
    // gửi email đặt lại mật khẩu
    sendResetPasswordEmail(email: string): Observable<any> {
        return this.http.post(`http://localhost:8080/authenticate/forgot-password/${email}`, {})
            .pipe(
                catchError((err: HttpErrorResponse) => {
                    return throwError(() => err);
                })
            );
    }
    resetPassword(token: string, newPassword: string): Observable<any> {
        return this.http.post(
            `http://localhost:8080/authenticate/reset-password`,
            {
                token: token,
                newPassword: newPassword
            }
        );
    }



}