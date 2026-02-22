import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CanBoFooterComponent } from './can-bo-footer.component';

describe('CanBoFooterComponent', () => {
  let component: CanBoFooterComponent;
  let fixture: ComponentFixture<CanBoFooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CanBoFooterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CanBoFooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
