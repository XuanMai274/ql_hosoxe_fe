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
  isSwitching = false;       // đang trong chế độ đổi tài khoản
  savedUsername = '';
  displayFullName = '';
  submitted = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthServiceComponent,
    private router: Router
  ) {
    // Ưu tiên lấy username thực thụ để đăng nhập
    const lastUsername = localStorage.getItem('username') || localStorage.getItem('savedIdentifier') || '';
    // Lấy fullName chỉ để hiển thị câu chào
    this.displayFullName = localStorage.getItem('fullName') || '';

    if (lastUsername) {
      this.isReturningUser = true;
      this.savedUsername = lastUsername;
    }

    this.loginForm = this.fb.group({
      username: [this.savedUsername, Validators.required],
      password: ['', Validators.required]
    });
  }

  /** Chuyển sang chế độ nhập tài khoản mới – chưa xóa dữ liệu cũ */
  onSwitchAccount(): void {
    this.isReturningUser = false;
    this.isSwitching = true;
    this.submitted = false;
    this.loginForm.patchValue({ username: '', password: '' });
  }

  /** Hủy đổi tài khoản – quay lại tài khoản đã lưu */
  onCancelSwitch(): void {
    this.isReturningUser = true;
    this.isSwitching = false;
    this.submitted = false;
    this.loginForm.patchValue({ username: this.savedUsername, password: '' });
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;

    this.authService.login(this.loginForm.value).subscribe({
      next: (response: AuthenticationResponse) => {
        // Nếu đang đổi tài khoản → xóa thông tin tài khoản cũ trước
        if (this.isSwitching) {
          localStorage.removeItem('savedIdentifier');
          localStorage.removeItem('fullName');
          localStorage.removeItem('username');
          this.isSwitching = false;
        }

        // Lưu thông tin tài khoản mới
        localStorage.setItem('savedIdentifier', response.username);
        localStorage.setItem('fullName', response.fullName);
        this.displayFullName = response.fullName;
        localStorage.setItem('username', response.username);

        // Lưu token và role vào localStorage (để đồng bộ giữa các Tab)
        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
        localStorage.setItem('userRole', response.role);

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
    // Luôn điều hướng về trang Home tổng hợp (HomeRouterComponent sẽ điều phối theo Role)
    this.router.navigate(['/manager/home']);
  }
}
