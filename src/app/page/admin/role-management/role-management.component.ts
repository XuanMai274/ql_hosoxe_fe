import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService } from '../../../service/admin.service';
import { Role, CreateRoleRequest, UpdateRoleRequest } from '../../../models/role.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-role-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './role-management.component.html',
  styleUrl: './role-management.component.css'
})
export class RoleManagementComponent implements OnInit {

  roles: Role[] = [];
  isLoading = false;
  showModal = false;
  isEditing = false;
  selectedRole: Role | null = null;

  roleForm: FormGroup;

  // Màu sắc icon cho từng vai trò
  readonly ROLE_ICONS: Record<string, { icon: string; color: string; bg: string }> = {
    admin: { icon: 'fa-shield-halved', color: '#b91c1c', bg: '#fee2e2' },
    manager: { icon: 'fa-user-tie', color: '#1d4ed8', bg: '#e8f3ff' },
    manager_1: { icon: 'fa-user-check', color: '#7c3aed', bg: '#f0ebff' },
    officer: { icon: 'fa-user', color: '#15803d', bg: '#dcfce7' },
    default: { icon: 'fa-user-lock', color: '#64748b', bg: '#f1f5f9' }
  };

  constructor(private adminService: AdminService, private fb: FormBuilder) {
    this.roleForm = this.fb.group({
      roleName: ['', [Validators.required, Validators.minLength(2)]],
      roleCode: ['', Validators.required],
      description: ['']
    });
  }

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.isLoading = true;
    this.adminService.getRoles().subscribe({
      next: (data) => { this.roles = data; this.isLoading = false; },
      error: (err) => {
        this.isLoading = false;
        Swal.fire({ icon: 'error', title: 'Lỗi', text: err?.error?.message || 'Không thể tải danh sách vai trò', confirmButtonColor: '#006b68' });
      }
    });
  }

  openCreateModal(): void {
    this.isEditing = false;
    this.selectedRole = null;
    this.roleForm.reset();
    this.roleForm.get('roleCode')?.enable();
    this.showModal = true;
  }

  openEditModal(role: Role): void {
    this.isEditing = true;
    this.selectedRole = role;
    this.roleForm.patchValue({
      roleName: role.roleName,
      roleCode: role.roleCode,
      description: role.description || ''
    });
    // Không cho sửa roleCode vì là khóa định danh
    this.roleForm.get('roleCode')?.disable();
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedRole = null;
  }

  onSubmit(): void {
    if (this.roleForm.invalid) {
      this.roleForm.markAllAsTouched();
      return;
    }

    const raw = this.roleForm.getRawValue();

    if (this.isEditing && this.selectedRole) {
      const payload: UpdateRoleRequest = { roleName: raw.roleName, description: raw.description };
      this.adminService.updateRole(this.selectedRole.id, payload).subscribe({
        next: () => {
          Swal.fire({ icon: 'success', title: 'Cập nhật thành công', timer: 1800, showConfirmButton: false });
          this.closeModal(); this.loadRoles();
        },
        error: (err) => Swal.fire({ icon: 'error', title: 'Lỗi', text: err?.error?.message || 'Cập nhật thất bại', confirmButtonColor: '#006b68' })
      });
    } else {
      const payload: CreateRoleRequest = { roleName: raw.roleName, roleCode: raw.roleCode, description: raw.description };
      this.adminService.createRole(payload).subscribe({
        next: () => {
          Swal.fire({ icon: 'success', title: 'Tạo vai trò thành công', timer: 1800, showConfirmButton: false });
          this.closeModal(); this.loadRoles();
        },
        error: (err) => Swal.fire({ icon: 'error', title: 'Lỗi', text: err?.error?.message || 'Tạo vai trò thất bại', confirmButtonColor: '#006b68' })
      });
    }
  }

  onDelete(role: Role): void {
    Swal.fire({
      title: 'Xác nhận xóa',
      html: `Bạn có chắc muốn xóa vai trò <strong>${role.roleName}</strong>?<br><small>Hành động này có thể ảnh hưởng đến các tài khoản đang sử dụng vai trò này.</small>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    }).then(result => {
      if (result.isConfirmed) {
        this.adminService.deleteRole(role.id).subscribe({
          next: () => {
            Swal.fire({ icon: 'success', title: 'Đã xóa', timer: 1500, showConfirmButton: false });
            this.loadRoles();
          },
          error: (err) => Swal.fire({ icon: 'error', title: 'Lỗi', text: err?.error?.message || 'Xóa thất bại', confirmButtonColor: '#006b68' })
        });
      }
    });
  }

  getRoleIcon(roleCode?: string): { icon: string; color: string; bg: string } {
    const key = (roleCode || '').toLowerCase();
    return this.ROLE_ICONS[key] || this.ROLE_ICONS['default'];
  }
}
