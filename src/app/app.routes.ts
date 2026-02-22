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
        children: [
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
        ]
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
