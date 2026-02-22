import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { AuthServiceComponent } from '../service/auth-service.component';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthServiceComponent, private router: Router) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this.authService.isAuthenticate()) {
      return true;
    }

    // Chưa đăng nhập, lưu lại URL định đến để quay lại sau khi login thành công
    sessionStorage.setItem('returnUrl', state.url);
    this.router.navigate(['/login']);
    return false;
  }
}
