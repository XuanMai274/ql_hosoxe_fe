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

    constructor(private http: HttpClient, private router: Router) {
        // Lắng nghe sự kiện thay đổi storage từ các Tab khác
        window.addEventListener('storage', (event) => {
            if (event.key === 'accessToken') {
                if (!event.newValue) {
                    // Nếu Tab khác xóa token (logout), Tab này cũng về login
                    this.finalizeLogout();
                } else {
                    // Nếu Tab khác đổi token (login tài khoản khác), Tab này load lại để cập nhật giao diện
                    window.location.reload();
                }
            }
        });
    }

    login(credentials: { username: string; password: string }): Observable<any> {
        return this.http.post<AuthenticationResponse>(this.apiUrl, credentials, {
            withCredentials: true  // Bắt buộc để trình duyệt nhận được HttpOnly Cookie (refreshToken) từ Backend
        })
            .pipe(
                catchError((error: HttpErrorResponse) => {
                    return throwError(() => error);
                })
            );
    }
    // refreshToken được gửi tự động qua HttpOnly Cookie (withCredentials: true)
    // KHÔNG cần gửi trong body hay header vì Backend tự đọc từ Cookie
    refreshToken(): Observable<AuthenticationResponse> {
        return this.http.post<AuthenticationResponse>(`http://localhost:8080/api/auth/refresh`, {}, {
            withCredentials: true  // Trình duyệt tự gửi HttpOnly Cookie kèm request
        });
    }

    // đăng xuất
    logout() {
        this.http.post('http://localhost:8080/api/auth/logout', {}, { withCredentials: true }).subscribe({
            next: () => {
                this.finalizeLogout();
            },
            error: () => {
                this.finalizeLogout();
            }
        });
    }

    private finalizeLogout() {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userRole");
        localStorage.removeItem("userId");
        console.log("đã đăng xuất");
        this.router.navigate(["/login"]);
    }
    // hàm kiểm tra người dùng đã đăng nhập chưa
    isAuthenticate(): boolean {
        // lấy token nếu có thì đã đăng nhập    
        const token = localStorage.getItem("accessToken");
        if (token !== null) {
            return true;
        } else {
            return false;
        }
    }
    // lấy role của người dùng
    getUserRole(): string {
        // Ưu tiên lấy trực tiếp từ localStorage đã lưu lúc login
        const storedRole = localStorage.getItem("userRole");
        if (storedRole) return storedRole;

        // Nếu không có (ví dụ: f5 trang), thử giải mã từ accessToken
        const token = localStorage.getItem("accessToken");
        if (!token) return "";
        try {
            const decodeToken: any = jwtDecode(token);
            return decodeToken.role || "";
        } catch {
            return "";
        }
    }

    // lấy ID của người dùng
    getUserId(): string | null {
        return localStorage.getItem("userId");
    }

    // kiểm tra phân quyền
    hasRole(allowedRoles: string[]): boolean {
        const role = this.getUserRole();
        return allowedRoles.some(r => r.toLowerCase() === role.toLowerCase());
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