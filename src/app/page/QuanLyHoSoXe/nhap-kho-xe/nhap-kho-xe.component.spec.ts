import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NhapKhoXeComponent } from './nhap-kho-xe.component';

describe('NhapKhoXeComponent', () => {
  let component: NhapKhoXeComponent;
  let fixture: ComponentFixture<NhapKhoXeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NhapKhoXeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NhapKhoXeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
