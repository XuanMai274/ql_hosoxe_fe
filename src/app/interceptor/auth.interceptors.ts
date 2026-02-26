import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { AuthServiceComponent } from '../core/service/auth-service.component';
import { AuthenticationResponse } from '../models/authentication-response.model';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    private refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
    private isRefreshing = false;

    constructor(
        private authService: AuthServiceComponent,
        private toastr: ToastrService,
        private router: Router
    ) {
        console.log("interceptor đã được khởi tạo")
    }
    // tự động gửi kèm token trong mỗi request
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const token = localStorage.getItem('accessToken');
        const isAuthEndpoint = req.url.includes('/api/auth/');

        let authReq = req.clone({
            withCredentials: true // Luôn gửi kèm Cookie
        });

        if (token && !isAuthEndpoint) {
            console.log("--- [Frontend] Adding Token to request: " + req.url);
            authReq = authReq.clone({
                setHeaders: {
                    Authorization: `Bearer ${token}`
                }
            });
        } else if (!isAuthEndpoint) {
            console.warn("--- [Frontend] No Token found for request: " + req.url);
        }

        return next.handle(authReq).pipe(
            catchError((error: HttpErrorResponse) => {
                if (error.status === 401 && !isAuthEndpoint) {
                    // Token hết hạn, thử refresh
                    return this.handle401Error(authReq, next);
                }

                if (error.status === 403) {
                    // Xử lý 403 Forbidden: Truy cập vùng cấm - chỉ thông báo, KHÔNG logout
                    this.toastr.error('Bạn không có quyền thực hiện hành động này!', 'Truy cập bị từ chối', {
                        progressBar: true,
                        closeButton: true
                    });
                }

                if (error.status === 404 && authReq.url.includes('/api/')) {
                    this.toastr.warning('Không tìm thấy nội dung yêu cầu hoặc quyền hạn không đủ.', 'Cảnh báo');
                }

                return throwError(() => error);
            })
        );
    }

    private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if (!this.isRefreshing) {
            this.isRefreshing = true;
            this.refreshTokenSubject.next(null);

            return this.authService.refreshToken().pipe(
                switchMap((response: AuthenticationResponse) => {
                    this.isRefreshing = false;
                    const newToken = response.accessToken;
                    const newRefreshToken = response.refreshToken;

                    localStorage.setItem('accessToken', newToken);
                    if (newRefreshToken) {
                        localStorage.setItem('refreshToken', newRefreshToken);
                    }
                    this.refreshTokenSubject.next(newToken);

                    return next.handle(request.clone({
                        setHeaders: {
                            Authorization: `Bearer ${newToken}`
                        }
                    }));
                }),
                catchError(err => {
                    this.isRefreshing = false;
                    // Báo lỗi cho các request đang đợi để không bị treo
                    this.refreshTokenSubject.error(err);
                    // Reset lại subject cho các lần login sau
                    this.refreshTokenSubject = new BehaviorSubject<string | null>(null);

                    // Xóa token và redirect về login, KHÔNG gọi authService.logout()
                    // vì logout() sẽ gọi thêm API và có thể gây vòng lặp lỗi
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('userRole');
                    localStorage.removeItem('username');
                    localStorage.removeItem('fullName');
                    this.router.navigate(['/login']);
                    return throwError(() => err);
                })
            );
        } else {
            return this.refreshTokenSubject.pipe(
                filter(token => token !== null),
                take(1),
                switchMap(token =>
                    next.handle(request.clone({
                        setHeaders: { Authorization: `Bearer ${token}` }
                    }))
                )
            );
        }
    }
}