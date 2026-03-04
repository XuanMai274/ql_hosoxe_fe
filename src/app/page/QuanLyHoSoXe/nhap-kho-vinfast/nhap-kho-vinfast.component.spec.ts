import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NhapKhoVinfastComponent } from './nhap-kho-vinfast.component';

describe('NhapKhoVinfastComponent', () => {
  let component: NhapKhoVinfastComponent;
  let fixture: ComponentFixture<NhapKhoVinfastComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NhapKhoVinfastComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NhapKhoVinfastComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
