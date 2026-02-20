import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DanhSachBaoLanhComponent } from './danh-sach-bao-lanh.component';

describe('DanhSachBaoLanhComponent', () => {
  let component: DanhSachBaoLanhComponent;
  let fixture: ComponentFixture<DanhSachBaoLanhComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DanhSachBaoLanhComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DanhSachBaoLanhComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
