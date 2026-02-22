import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CanBoSidebarComponent } from './can-bo-sidebar.component';

describe('CanBoSidebarComponent', () => {
  let component: CanBoSidebarComponent;
  let fixture: ComponentFixture<CanBoSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CanBoSidebarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CanBoSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
