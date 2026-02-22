import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThemHoSoXeComponent } from './them-ho-so-xe.component';

describe('ThemHoSoXeComponent', () => {
  let component: ThemHoSoXeComponent;
  let fixture: ComponentFixture<ThemHoSoXeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThemHoSoXeComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ThemHoSoXeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
