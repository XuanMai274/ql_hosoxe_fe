import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CanBoHeaderComponent } from './can-bo-header.component';

describe('CanBoHeaderComponent', () => {
  let component: CanBoHeaderComponent;
  let fixture: ComponentFixture<CanBoHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CanBoHeaderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CanBoHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
