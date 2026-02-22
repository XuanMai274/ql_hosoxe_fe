import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { ThemHoSoXeComponent } from './page/QuanLyHoSoXe/them-ho-so-xe/them-ho-so-xe.component';
import { ThemHoSoXeHyundaiComponent } from './page/QuanLyHoSoXe/them-ho-so-xe-hyundai/them-ho-so-xe-hyundai.component';
import { ThemHoSoXeVinfastComponent } from './page/QuanLyHoSoXe/them-ho-so-xe-vinfast/them-ho-so-xe-vinfast.component';
import { CanBoComponent } from './layout/can-bo/can-bo.component';
import { NgModule } from '@angular/core';
import { ThemBaoLanhComponent } from './page/QuanLyBaoLanh/them-bao-lanh/them-bao-lanh.component';
import { DanhSachBaoLanhComponent } from './page/QuanLyBaoLanh/danh-sach-bao-lanh/danh-sach-bao-lanh.component';
import { ChinhSuaBaoLanhComponent } from './page/QuanLyBaoLanh/chinh-sua-bao-lanh/chinh-sua-bao-lanh.component';
import { DanhSachHoSoXeComponent } from './page/QuanLyHoSoXe/danh-sach-ho-so-xe/danh-sach-ho-so-xe.component';
import { ChiTietXeComponent } from './page/QuanLyHoSoXe/chi-tiet-xe/chi-tiet-xe.component';
import { NhapKhoXeComponent } from './page/QuanLyHoSoXe/nhap-kho-xe/nhap-kho-xe.component';
import { NotFoundComponent } from './page/not-found/not-found.component';
import { EmployeeManagementComponent } from './page/admin/employee-management/employee-management.component';
import { CustomerManagementComponent } from './page/admin/customer-management/customer-management.component';
import { RoleManagementComponent } from './page/admin/role-management/role-management.component';
import { HomeRouterComponent } from './page/home-router.component';

import { AuthGuard } from './core/guard/auth.guard';
import { RoleGuard } from './core/guard/role.guard';
import { DanhSachKhoanVayComponent } from './page/QuanLyKhoanVay/danh-sach-khoan-vay/danh-sach-khoan-vay.component';
import { ChiTietKhoanVayComponent } from './page/QuanLyKhoanVay/chi-tiet-khoan-vay/chi-tiet-khoan-vay.component';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    },
    {
        path: 'login',
        component: LoginComponent
    },
    {
        path: 'manager',
        component: CanBoComponent,
        canActivate: [AuthGuard], // Bảo vệ toàn bộ cụm manager
        children: [
            {
                path: 'home',
                component: HomeRouterComponent
            },
            {
                path: 'them-ho-so-xe',
                component: ThemHoSoXeComponent
            },
            {
                path: 'them-ho-so-xe-hyundai',
                component: ThemHoSoXeHyundaiComponent
            },
            {
                path: 'them-ho-so-xe-vinfast',
                component: ThemHoSoXeVinfastComponent
            },
            {
                path: 'danh-sach-ho-so-xe',
                component: DanhSachHoSoXeComponent
            },
            {
                path: 'vehicles/detail/:id',
                component: ChiTietXeComponent
            },
            {
                path: 'nhap-kho-xe',
                component: NhapKhoXeComponent
            },
            {
                path: 'them-bao-lanh',
                component: ThemBaoLanhComponent
            },
            {
                path: 'danh-sach-bao-lanh',
                component: DanhSachBaoLanhComponent
            },
            {
                path: 'chinh-sua-bao-lanh/:id',
                component: ChinhSuaBaoLanhComponent
            },
            {
                path: 'danh-sach-khoan-vay',
                component: DanhSachKhoanVayComponent
            },
            {
                path: 'chinh-sua-khoan-vay/:id',
                component: ChiTietKhoanVayComponent
            },
            // ADMIN ROUTES
            {
                path: 'admin/employees',
                component: EmployeeManagementComponent,
                canActivate: [RoleGuard],
                data: { roles: ['admin'] }
            },
            {
                path: 'admin/customers',
                component: CustomerManagementComponent,
                canActivate: [RoleGuard],
                data: { roles: ['admin'] }
            },
            {
                path: 'admin/roles',
                component: RoleManagementComponent,
                canActivate: [RoleGuard],
                data: { roles: ['admin'] }
            }
        ]
    },
    {
        path: '**',
        component: NotFoundComponent
    }
];

@NgModule({
    imports: [
        RouterModule.forRoot(routes, {
            scrollPositionRestoration: 'enabled'
        })
    ],
    exports: [RouterModule]
})
export class AppRoutingModule { }
