import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthServiceComponent } from '../core/service/auth-service.component';

@Component({
    selector: 'app-root-redirect',
    standalone: true,
    template: ''
})
export class RootRedirectComponent implements OnInit {
    constructor(private authService: AuthServiceComponent, private router: Router) { }

    ngOnInit(): void {
        if (this.authService.isAuthenticate()) {
            const role = this.authService.getUserRole()?.toLowerCase() || '';
            if (role.includes('customer')) {
                this.router.navigate(['/customer/home']);
            } else {
                this.router.navigate(['/manager/home']);
            }
        } else {
            this.router.navigate(['/login']);
        }
    }
}
