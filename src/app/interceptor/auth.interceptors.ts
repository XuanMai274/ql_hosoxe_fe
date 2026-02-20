import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { AuthServiceComponent } from '../core/service/auth-service.component';
import { AuthenticationResponse } from '../models/authentication-response.model';
import Swal from 'sweetalert2';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    private refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
    private isRefreshing = false;

    constructor(private authService: AuthServiceComponent) {
        console.log("interceptor đã được khởi tạo")
    }
    // tự động gửi kèm token trong mỗi request
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const token = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');
        let authReq = req;
        if (token) {
            authReq = req.clone({
                setHeaders: {
                    Authorization: `Bearer ${token}`,
                    'Authorization-Refresh': refreshToken || ''
                }
            });
            console.log("đã set token: " + token)
            console.log("đã set refresh: " + refreshToken)
        }

        return next.handle(authReq).pipe(
            catchError((error: HttpErrorResponse) => {
                if (error.status === 401) {
                    Swal.fire({
                        title: 'Phiên đăng nhập hết hạn!',
                        text: 'Vui lòng đăng nhập lại.',
                        icon: 'warning',
                        confirmButtonText: 'OK',
                        timer: 3000,
                        timerProgressBar: true,
                        customClass: {
                            popup: 'custom-popup',
                        }
                    });
                    this.authService.logout(); // Gọi hàm logout khi gặp lỗi 401
                } else if (error.status === 403) {
                    return this.handle403Response(authReq, next);
                }
                return throwError(() => error);
            })
        );
    }

    private handle403Response(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<AuthenticationResponse>> {
        console.log("đã vào handle403Response");

        if (!this.isRefreshing) {
            this.isRefreshing = true;
            this.refreshTokenSubject.next(null);

            return this.authService.refreshToken().pipe(
                switchMap((response: AuthenticationResponse) => {
                    this.isRefreshing = false;
                    const newToken = response.accessToken;

                    // Lưu token mới vào localStorage
                    localStorage.setItem('accessToken', newToken);
                    this.refreshTokenSubject.next(newToken);

                    // Gửi lại request ban đầu với token mới
                    return next.handle(request.clone({
                        setHeaders: {
                            Authorization: `Bearer ${newToken}`,
                            'Refresh-Token': response.refreshToken || ''
                        }
                    })) as Observable<HttpEvent<AuthenticationResponse>>;
                }),
                catchError(err => {
                    this.isRefreshing = false;
                    this.authService.logout();
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