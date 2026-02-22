import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CanBoComponent } from './can-bo.component';

describe('CanBoComponent', () => {
  let component: CanBoComponent;
  let fixture: ComponentFixture<CanBoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CanBoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CanBoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
