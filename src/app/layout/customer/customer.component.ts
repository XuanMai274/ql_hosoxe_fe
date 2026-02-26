import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CustomerSidebarComponent } from '../../share/component/customer-sidebar/customer-sidebar.component';
import { CustomerHeaderComponent } from '../../share/component/customer-header/customer-header.component';

@Component({
    selector: 'app-customer',
    standalone: true,
    imports: [RouterModule, CustomerSidebarComponent, CustomerHeaderComponent],
    templateUrl: './customer.component.html',
    styleUrl: './customer.component.css'
})
export class CustomerComponent { }
