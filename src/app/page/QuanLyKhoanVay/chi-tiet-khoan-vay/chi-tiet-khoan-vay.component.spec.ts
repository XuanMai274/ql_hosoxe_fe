import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChiTietKhoanVayComponent } from './chi-tiet-khoan-vay.component';

describe('ChiTietKhoanVayComponent', () => {
  let component: ChiTietKhoanVayComponent;
  let fixture: ComponentFixture<ChiTietKhoanVayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChiTietKhoanVayComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChiTietKhoanVayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
