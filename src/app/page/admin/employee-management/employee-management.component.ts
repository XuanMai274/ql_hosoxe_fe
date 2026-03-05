import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService } from '../../../service/admin.service';
import { Role } from '../../../models/role.model';
import { Employee, CreateEmployeeWithAccountRequest, UpdateEmployeeRequest } from '../../../models/employee.model';
import Swal from 'sweetalert2';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-employee-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './employee-management.component.html',
  styleUrl: './employee-management.component.css'
})
export class EmployeeManagementComponent implements OnInit {

  employees: Employee[] = [];
  isLoading = false;
  searchKeyword = '';

  // Pagination
  page = 0;
  size = 10;
  totalElements = 0;
  totalPages = 0;

  // Modal state
  showModal = false;
  isEditing = false;
  selectedEmployee: Employee | null = null;

  employeeForm: FormGroup;

  availableRoles: Role[] = [];

  private searchSubject = new Subject<string>();

  constructor(private adminService: AdminService, private fb: FormBuilder) {
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(() => {
      this.page = 0;
      this.loadEmployees();
    });
    this.employeeForm = this.fb.group({
      // Thông tin nhân viên
      employeeCode: ['', Validators.required],
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      position: [''],
      status: ['ACTIVE'],
      // Thông tin tài khoản
      username: ['', Validators.required],
      password: ['', [
        Validators.required,
        Validators.minLength(6),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9!@#$%^&*(),.?":{}|<>]).+$/)
      ]],
      roleId: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadEmployees();
    this.loadRoles();
  }

  loadRoles(): void {
    this.adminService.getRoles().subscribe({
      next: (data) => {
        // Chỉ lấy các vai trò dành cho nhân viên (loại trừ CUSTOMER)
        this.availableRoles = (data || []).filter(r => r.code !== 'CUSTOMER');
      },
      error: (err) => console.error('Không thể tải danh sách vai trò:', err)
    });
  }

  loadEmployees(): void {
    this.isLoading = true;
    this.adminService.getEmployees(this.page, this.size, this.searchKeyword).subscribe({
      next: (res: any) => {
        // Hỗ trợ cả PageResponse và mảng trực tiếp
        if (res && res.content) {
          this.employees = res.content;
          this.totalElements = res.totalElements;
          this.totalPages = res.totalPages;
        } else if (Array.isArray(res)) {
          this.employees = res;
          this.totalElements = res.length;
          this.totalPages = Math.ceil(res.length / this.size) || 1;
        } else {
          this.employees = [];
          this.totalElements = 0;
          this.totalPages = 0;
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        Swal.fire({ icon: 'error', title: 'Lỗi', text: err?.error?.message || 'Không thể tải danh sách nhân viên', confirmButtonColor: '#006b68' });
      }
    });
  }

  onSearch(value: string): void {
    const val = value ? value.trim() : '';
    this.searchKeyword = val;

    // Nếu xóa trắng, gọi ngay lập tức cho mượt
    if (!val) {
      this.page = 0;
      this.loadEmployees();
    } else {
      this.searchSubject.next(val);
    }
  }

  changePage(newPage: number): void {
    if (newPage >= 0 && newPage < this.totalPages) {
      this.page = newPage;
      this.loadEmployees();
    }
  }

  openCreateModal(): void {
    this.isEditing = false;
    this.selectedEmployee = null;
    this.employeeForm.reset({ status: 'ACTIVE' });
    // Reset role specifically if needed, using first available role id or default
    if (this.availableRoles.length > 0) {
      this.employeeForm.patchValue({ roleId: this.availableRoles[0].id });
    }

    this.employeeForm.get('username')?.enable();
    this.employeeForm.get('password')?.enable();
    this.employeeForm.get('employeeCode')?.enable();
    this.showModal = true;
  }

  openEditModal(emp: Employee): void {
    this.isEditing = true;
    this.selectedEmployee = emp;
    this.employeeForm.patchValue({
      employeeCode: emp.employeeCode,
      fullName: emp.fullName,
      email: emp.email,
      phone: emp.phone,
      position: emp.position,
      status: emp.status || 'ACTIVE',
      username: emp.username,
      password: '••••••••',
      roleId: emp.roleId,
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
      console.log('Form errors:', this.employeeForm.errors);
      // Log individual field errors
      Object.keys(this.employeeForm.controls).forEach(key => {
        const controlErrors = this.employeeForm.get(key)?.errors;
        if (controlErrors != null) {
          console.log('Field: ' + key + ', Errors: ', controlErrors);
        }
      });
      this.employeeForm.markAllAsTouched();
      Swal.fire({ icon: 'warning', title: 'Thông tin chưa hợp lệ', text: 'Vui lòng kiểm tra lại các trường thông tin bắt buộc.', confirmButtonColor: '#006b68' });
      return;
    }

    const raw = this.employeeForm.getRawValue();

    if (this.isEditing && this.selectedEmployee) {
      const payload: UpdateEmployeeRequest = {
        employeeCode: raw.employeeCode,
        fullName: raw.fullName,
        email: raw.email,
        phone: raw.phone,
        position: raw.position,
        status: raw.status,
        roleId: Number(raw.roleId),
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
        employee: {
          employeeCode: raw.employeeCode,
          fullName: raw.fullName,
          email: raw.email,
          phone: raw.phone,
          position: raw.position,
        },
        username: raw.username,
        password: raw.password,
        roleId: Number(raw.roleId),
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
