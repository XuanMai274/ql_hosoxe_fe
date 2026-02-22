import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { AuthServiceComponent } from '../service/auth-service.component';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthServiceComponent, private router: Router) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const allowedRoles = route.data['roles'] as Array<string>;

    if (this.authService.hasRole(allowedRoles)) {
      return true;
    }

    // Không đủ quyền, thông báo và chặn
    Swal.fire({
      icon: 'error',
      title: 'Truy cập bị từ chối',
      text: 'Tài khoản của bạn không có quyền truy cập vào chức năng này.',
      confirmButtonColor: '#006b68'
    });

    // Quay về trang chủ của cán bộ hoặc login tùy ngữ cảnh
    this.router.navigate(['/manager/danh-sach-ho-so-xe']);
    return false;
  }
}
