import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DanhSachKhoanVayComponent } from './danh-sach-khoan-vay.component';

describe('DanhSachKhoanVayComponent', () => {
  let component: DanhSachKhoanVayComponent;
  let fixture: ComponentFixture<DanhSachKhoanVayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DanhSachKhoanVayComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DanhSachKhoanVayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
