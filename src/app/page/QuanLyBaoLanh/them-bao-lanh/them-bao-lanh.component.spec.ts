import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThemBaoLanhComponent } from './them-bao-lanh.component';

describe('ThemBaoLanhComponent', () => {
  let component: ThemBaoLanhComponent;
  let fixture: ComponentFixture<ThemBaoLanhComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThemBaoLanhComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ThemBaoLanhComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
