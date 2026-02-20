import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChinhSuaBaoLanhComponent } from './chinh-sua-bao-lanh.component';

describe('ChinhSuaBaoLanhComponent', () => {
  let component: ChinhSuaBaoLanhComponent;
  let fixture: ComponentFixture<ChinhSuaBaoLanhComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChinhSuaBaoLanhComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChinhSuaBaoLanhComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
