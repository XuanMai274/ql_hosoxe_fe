import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CanBoSidebarComponent } from '../../share/component/can-bo-sidebar/can-bo-sidebar.component';
import { CanBoFooterComponent } from '../../share/component/can-bo-footer/can-bo-footer.component';
import { CanBoHeaderComponent } from '../../share/component/can-bo-header/can-bo-header.component';
import { RouterModule } from '@angular/router';
import { Renderer2, OnInit, OnDestroy } from '@angular/core';
@Component({
  selector: 'app-manager',
  standalone: true,
  imports: [
    RouterModule,
    CanBoSidebarComponent,
    CanBoFooterComponent,
    CanBoHeaderComponent
  ],
  templateUrl: './can-bo.component.html',
  styleUrl: './can-bo.component.css'
})
export class CanBoComponent {

}
