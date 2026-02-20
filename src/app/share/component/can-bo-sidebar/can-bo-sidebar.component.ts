import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-can-bo-sidebar',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './can-bo-sidebar.component.html',
  styleUrl: './can-bo-sidebar.component.css'
})
export class CanBoSidebarComponent {
  activeSubmenu: string | null = null;

  toggleSubmenu(name: string) {
    this.activeSubmenu = this.activeSubmenu === name ? null : name;
  }
}
