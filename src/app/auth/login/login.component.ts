import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthServiceComponent } from '../../core/service/auth-service.component';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthenticationResponse } from '../../models/authentication-response.model';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-login',
  imports: [CommonModule,
    ReactiveFormsModule,
    RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  loginForm: FormGroup;
  isLoading = false;
  isReturningUser = false;
  savedUsername = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthServiceComponent,
    private router: Router
  ) {
    this.savedUsername = localStorage.getItem('fullName') || localStorage.getItem('savedIdentifier') || '';
    if (this.savedUsername) {
      this.isReturningUser = true;
    }

    this.loginForm = this.fb.group({
      username: [this.savedUsername, Validators.required],
      password: ['', Validators.required]
    });
  }

  onSwitchAccount(): void {
    this.isReturningUser = false;
    this.savedUsername = '';
    // Xóa sạch mọi dấu vết của tài khoản cũ
    localStorage.removeItem('savedIdentifier');
    localStorage.removeItem('fullName');
    localStorage.removeItem('username');
    this.loginForm.patchValue({
      username: '',
      password: ''
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    this.authService.login(this.loginForm.value).subscribe({
      next: (response: AuthenticationResponse) => {
        // Lưu username vào localStorage để hiển thị cho màn hình chào mừng quay lại
        localStorage.setItem('savedIdentifier', response.username);
        // Lưu fullName để hiển thị lời chào và trên Header
        localStorage.setItem('fullName', response.fullName);
        // Lưu username riêng biệt nếu cần thiết cho các mục đích khác
        localStorage.setItem('username', response.username);

        // Lưu token vào sessionStorage (tự xóa khi đóng trình duyệt)
        sessionStorage.setItem('accessToken', response.accessToken);
        sessionStorage.setItem('refreshToken', response.refreshToken);

        // Điều hướng sau login
        const returnUrl = sessionStorage.getItem('returnUrl');
        if (returnUrl) {
          this.router.navigateByUrl(returnUrl);
          sessionStorage.removeItem('returnUrl');
        } else {
          this.navigateByRole(response.role);
        }

        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;

        // Lấy message từ backend trả về, nếu không có thì dùng message mặc định
        const errorMessage = err?.error?.message || 'Tên đăng nhập hoặc mật khẩu không đúng';

        Swal.fire({
          icon: 'error',
          title: 'Đăng nhập thất bại',
          text: errorMessage,
          confirmButtonColor: '#006b68',
          confirmButtonText: 'OK'
        });

        console.error(err);
      }
    });
  }

  private navigateByRole(role: string): void {
    switch (role) {
      case 'MANAGER':
      case 'MANAGER_1':
      case 'ADMIN':
        // Điều hướng vào trang danh sách hồ sơ xe của cán bộ
        this.router.navigate(['/manager/danh-sach-ho-so-xe']);
        break;

      default:
        // Nếu không khớp role nào, mặc định vào danh sách hồ sơ hoặc trang chủ hiện có
        this.router.navigate(['/manager/danh-sach-ho-so-xe']);
        break;
    }
  }
}
