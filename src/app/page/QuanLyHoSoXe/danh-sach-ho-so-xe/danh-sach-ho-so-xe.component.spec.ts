import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DanhSachHoSoXeComponent } from './danh-sach-ho-so-xe.component';

describe('DanhSachHoSoXeComponent', () => {
  let component: DanhSachHoSoXeComponent;
  let fixture: ComponentFixture<DanhSachHoSoXeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DanhSachHoSoXeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DanhSachHoSoXeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
