import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, GuardResult, MaybeAsync } from "@angular/router";
import { AuthServiceComponent } from '../core/service/auth-service.component';
import { Observer } from "rxjs";

@Injectable({
    providedIn: 'root'
})
// class này cấu hình ngăn chặn truy cập vào các url k được phép( nếu k có roke thì k vào đc giao diện đó)
export class AuthGuard implements CanActivate {
    constructor(private authService: AuthServiceComponent, private router: Router) { }
    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): MaybeAsync<GuardResult> {
        const expectedRole = route.data['expectedRole'];// role yêu cầu từ route.ts của đường dẫn đó
        const userRole = this.authService.getUserRole();// lấy role từ token
        console.log("Quyền" + userRole)
        if (userRole && expectedRole.includes(userRole)) {
            return true; // Cho phép truy cập nếu user có role phù hợp
        }
        this.router.navigate(['/login']);
        return false;

    }
}