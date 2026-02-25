import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService } from '../../../service/admin.service';
import { Employee, CreateEmployeeWithAccountRequest, UpdateEmployeeRequest } from '../../../models/employee.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-employee-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './employee-management.component.html',
  styleUrl: './employee-management.component.css'
})
export class EmployeeManagementComponent implements OnInit {

  employees: Employee[] = [];
  filteredEmployees: Employee[] = [];
  isLoading = false;
  searchKeyword = '';

  // Modal state
  showModal = false;
  isEditing = false;
  selectedEmployee: Employee | null = null;

  employeeForm: FormGroup;

  readonly ROLES = ['admin', 'manager', 'officer', 'manager_1'];
  readonly DEPARTMENTS = ['Phòng Tín dụng', 'Phòng Khách hàng', 'Phòng Kế toán', 'Phòng IT', 'Phòng Hành chính', 'Phòng Kiểm soát'];

  constructor(private adminService: AdminService, private fb: FormBuilder) {
    this.employeeForm = this.fb.group({
      // Thông tin nhân viên
      employeeCode: ['', Validators.required],
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      department: [''],
      position: [''],
      status: ['ACTIVE'],
      // Thông tin tài khoản
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['officer', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.isLoading = true;
    this.adminService.getEmployees().subscribe({
      next: (data) => {
        this.employees = data;
        this.filteredEmployees = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        Swal.fire({ icon: 'error', title: 'Lỗi', text: err?.error?.message || 'Không thể tải danh sách nhân viên', confirmButtonColor: '#006b68' });
      }
    });
  }

  onSearch(): void {
    const kw = this.searchKeyword.toLowerCase().trim();
    if (!kw) {
      this.filteredEmployees = this.employees;
    } else {
      this.filteredEmployees = this.employees.filter(e =>
        e.fullName?.toLowerCase().includes(kw) ||
        e.employeeCode?.toLowerCase().includes(kw) ||
        e.department?.toLowerCase().includes(kw) ||
        e.email?.toLowerCase().includes(kw)
      );
    }
  }

  openCreateModal(): void {
    this.isEditing = false;
    this.selectedEmployee = null;
    this.employeeForm.reset({ status: 'ACTIVE', role: 'officer' });
    // Enable tất cả fields khi tạo mới
    this.employeeForm.get('username')?.enable();
    this.employeeForm.get('password')?.enable();
    this.employeeForm.get('employeeCode')?.enable();
    this.showModal = true;
  }

  openEditModal(emp: Employee): void {
    this.isEditing = true;
    this.selectedEmployee = emp;
    // Khi edit: không cho đổi username/password/mã NV
    this.employeeForm.patchValue({
      employeeCode: emp.employeeCode,
      fullName: emp.fullName,
      email: emp.email,
      phone: emp.phone,
      department: emp.department,
      position: emp.position,
      status: emp.status || 'ACTIVE',
      username: emp.username,
      password: '••••••••',
      role: emp.role || 'officer',
    });
    this.employeeForm.get('username')?.disable();
    this.employeeForm.get('password')?.disable();
    this.employeeForm.get('employeeCode')?.disable();
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedEmployee = null;
  }

  onSubmit(): void {
    if (this.employeeForm.invalid) {
      this.employeeForm.markAllAsTouched();
      return;
    }

    const raw = this.employeeForm.getRawValue();

    if (this.isEditing && this.selectedEmployee) {
      const payload: UpdateEmployeeRequest = {
        fullName: raw.fullName,
        email: raw.email,
        phone: raw.phone,
        department: raw.department,
        position: raw.position,
        status: raw.status,
        role: raw.role,
      };
      this.adminService.updateEmployee(this.selectedEmployee.id, payload).subscribe({
        next: () => {
          Swal.fire({ icon: 'success', title: 'Cập nhật thành công', timer: 1800, showConfirmButton: false });
          this.closeModal();
          this.loadEmployees();
        },
        error: (err) => Swal.fire({ icon: 'error', title: 'Lỗi', text: err?.error?.message || 'Cập nhật thất bại', confirmButtonColor: '#006b68' })
      });
    } else {
      const payload: CreateEmployeeWithAccountRequest = {
        employeeCode: raw.employeeCode,
        fullName: raw.fullName,
        email: raw.email,
        phone: raw.phone,
        department: raw.department,
        position: raw.position,
        username: raw.username,
        password: raw.password,
        role: raw.role,
      };
      this.adminService.createEmployeeWithAccount(payload).subscribe({
        next: () => {
          Swal.fire({ icon: 'success', title: 'Tạo nhân viên thành công', timer: 1800, showConfirmButton: false });
          this.closeModal();
          this.loadEmployees();
        },
        error: (err) => Swal.fire({ icon: 'error', title: 'Lỗi', text: err?.error?.message || 'Tạo nhân viên thất bại', confirmButtonColor: '#006b68' })
      });
    }
  }

  onDelete(emp: Employee): void {
    Swal.fire({
      title: 'Xác nhận xóa',
      html: `Bạn có chắc muốn xóa nhân viên <strong>${emp.fullName}</strong>?<br><small>Hành động này không thể hoàn tác.</small>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    }).then(result => {
      if (result.isConfirmed) {
        this.adminService.deleteEmployee(emp.id).subscribe({
          next: () => {
            Swal.fire({ icon: 'success', title: 'Đã xóa', timer: 1500, showConfirmButton: false });
            this.loadEmployees();
          },
          error: (err) => Swal.fire({ icon: 'error', title: 'Lỗi', text: err?.error?.message || 'Xóa thất bại', confirmButtonColor: '#006b68' })
        });
      }
    });
  }

  getRoleBadgeClass(role?: string): string {
    switch (role?.toLowerCase()) {
      case 'admin': return 'badge-admin';
      case 'manager': return 'badge-manager';
      case 'manager_1': return 'badge-manager1';
      case 'officer': return 'badge-officer';
      default: return 'badge-default';
    }
  }

  getStatusBadgeClass(status?: string): string {
    return status === 'ACTIVE' ? 'status-active' : 'status-inactive';
  }

  countByStatus(status: string): number {
    return this.employees.filter(e => e.status === status).length;
  }

  countByRole(role: string): number {
    return this.employees.filter(e => e.role?.toLowerCase() === role.toLowerCase()).length;
  }
}
