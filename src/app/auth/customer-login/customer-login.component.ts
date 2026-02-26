import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthServiceComponent } from '../../core/service/auth-service.component';
import { AuthenticationResponse } from '../../models/authentication-response.model';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-customer-login',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './customer-login.component.html',
    styleUrl: './customer-login.component.css'
})
export class CustomerLoginComponent {

    loginForm: FormGroup;
    isLoading = false;
    submitted = false;
    showPassword = false;

    // Returning user
    isReturningUser = false;
    isSwitching = false;
    savedUsername = '';
    displayFullName = '';

    constructor(
        private fb: FormBuilder,
        private authService: AuthServiceComponent,
        private router: Router
    ) {
        const lastUsername = localStorage.getItem('username') || localStorage.getItem('savedIdentifier') || '';
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

    onSwitchAccount(): void {
        this.isReturningUser = false;
        this.isSwitching = true;
        this.submitted = false;
        this.loginForm.patchValue({ username: '', password: '' });
    }

    onCancelSwitch(): void {
        this.isReturningUser = true;
        this.isSwitching = false;
        this.submitted = false;
        this.loginForm.patchValue({ username: this.savedUsername, password: '' });
    }

    togglePassword(): void {
        this.showPassword = !this.showPassword;
    }

    onSubmit(): void {
        this.submitted = true;
        if (this.loginForm.invalid) return;

        this.isLoading = true;

        this.authService.login(this.loginForm.value).subscribe({
            next: (response: AuthenticationResponse) => {
                if (this.isSwitching) {
                    localStorage.removeItem('savedIdentifier');
                    localStorage.removeItem('fullName');
                    localStorage.removeItem('username');
                    this.isSwitching = false;
                }

                localStorage.setItem('savedIdentifier', response.username);
                localStorage.setItem('fullName', response.fullName);
                localStorage.setItem('username', response.username);
                localStorage.setItem('accessToken', response.accessToken);
                localStorage.setItem('refreshToken', response.refreshToken);
                localStorage.setItem('userRole', response.role);

                this.isLoading = false;

                // Điều hướng customer
                const returnUrl = sessionStorage.getItem('returnUrl');
                if (returnUrl) {
                    this.router.navigateByUrl(returnUrl);
                    sessionStorage.removeItem('returnUrl');
                } else {
                    this.router.navigate(['/customer/don-hang-bao-lanh']);
                }
            },
            error: (err) => {
                this.isLoading = false;
                const errorMessage = err?.error?.message || 'Tên đăng nhập hoặc mật khẩu không đúng';
                Swal.fire({
                    icon: 'error',
                    title: 'Đăng nhập thất bại',
                    text: errorMessage,
                    confirmButtonColor: '#1a56db',
                    confirmButtonText: 'Thử lại'
                });
            }
        });
    }
}
