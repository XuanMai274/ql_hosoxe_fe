import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService } from '../../../service/admin.service';
import { Customer, CreateCustomerWithAccountRequest } from '../../../models/customer.model';
import { Role } from '../../../models/role.model';
import Swal from 'sweetalert2';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-customer-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './customer-management.component.html',
  styleUrl: './customer-management.component.css'
})
export class CustomerManagementComponent implements OnInit {

  customers: Customer[] = [];
  isLoading = false;
  searchKeyword = '';

  // Pagination
  page = 0;
  size = 10;
  totalElements = 0;
  totalPages = 0;

  showModal = false;
  isEditing = false;
  selectedCustomer: Customer | null = null;
  isSubmitted = false;
  showPassword = false;

  customerForm: FormGroup;
  availableRoles: Role[] = [];

  readonly CUSTOMER_TYPES = [
    { value: 'CA_NHAN', label: 'Cá nhân' },
    { value: 'DOANH_NGHIEP', label: 'Doanh nghiệp' }
  ];

  private searchSubject = new Subject<string>();

  constructor(private adminService: AdminService, private fb: FormBuilder) {
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(() => {
      this.page = 0;
      this.loadCustomers();
    });
    this.customerForm = this.fb.group({
      customerName: ['', Validators.required],
      customerType: ['CA_NHAN', Validators.required],
      cif: [''],
      phone: ['', [Validators.pattern(/^0[0-9]{9}$/)]],
      email: ['', [Validators.required, Validators.email]],
      address: [''],
      taxCode: [''],
      businessRegistrationNo: [''],
      representativeName: [''],
      representativeTitle: [''],
      bankAccountNo: [''],
      bankName: [''],
      status: ['ACTIVE'],
      // Account fields
      id: [null],
      userAccountId: [null],
      username: ['', Validators.required],
      password: ['', [
        Validators.required,
        Validators.minLength(6),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9!@#$%^&*(),.?":{}|<>]).+$/)
      ]],
      roleId: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadCustomers();
    this.loadRoles();
  }

  loadRoles(): void {
    this.adminService.getRoles().subscribe({
      next: (data) => {
        // Khách hàng chỉ được phép có vai trò CUSTOMER
        this.availableRoles = (data || []).filter(r => r.code === 'CUSTOMER');
        const customerRole = this.availableRoles.find(r => r.code === 'CUSTOMER');
        if (customerRole) {
          this.customerForm.patchValue({ roleId: customerRole.id });
        }
      },
      error: (err) => console.error('Không thể tải danh sách vai trò:', err)
    });
  }

  loadCustomers(): void {
    this.isLoading = true;
    this.adminService.getCustomers(this.page, this.size, this.searchKeyword).subscribe({
      next: (res: any) => {
        if (res && res.content) {
          this.customers = res.content;
          this.totalElements = res.totalElements;
          this.totalPages = res.totalPages;
        } else if (Array.isArray(res)) {
          this.customers = res;
          this.totalElements = res.length;
          this.totalPages = Math.ceil(res.length / this.size) || 1;
        } else {
          this.customers = [];
          this.totalElements = 0;
          this.totalPages = 0;
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        Swal.fire({ icon: 'error', title: 'Lỗi', text: err?.error?.message || 'Không thể tải danh sách khách hàng', confirmButtonColor: '#006b68' });
      }
    });
  }

  onSearch(value: string): void {
    const val = value ? value.trim() : '';
    this.searchKeyword = val;
    if (!val) {
      this.page = 0;
      this.loadCustomers();
    } else {
      this.searchSubject.next(val);
    }
  }

  changePage(newPage: number): void {
    if (newPage >= 0 && newPage < this.totalPages) {
      this.page = newPage;
      this.loadCustomers();
    }
  }

  openCreateModal(): void {
    this.isEditing = false;
    this.selectedCustomer = null;
    this.isSubmitted = false;
    this.customerForm.reset({ customerType: 'INDIVIDUAL', status: 'ACTIVE' });
    const customerRole = this.availableRoles.find(r => r.code === 'CUSTOMER');
    if (customerRole) {
      this.customerForm.patchValue({ roleId: customerRole.id });
    }
    this.customerForm.get('roleId')?.setValidators(Validators.required);
    this.customerForm.get('username')?.setValidators(Validators.required);
    this.customerForm.get('password')?.setValidators([
      Validators.required,
      Validators.minLength(6),
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9!@#$%^&*(),.?":{}|<>]).+$/)
    ]);
    this.customerForm.get('username')?.enable();
    this.customerForm.get('password')?.enable();
    this.showModal = true;
  }

  openEditModal(customer: Customer): void {
    this.isEditing = true;
    this.isSubmitted = false;
    this.selectedCustomer = customer;
    this.customerForm.patchValue({ ...customer });
    this.customerForm.get('username')?.disable();
    this.customerForm.get('password')?.disable();
    this.customerForm.get('roleId')?.clearValidators();
    this.customerForm.get('roleId')?.updateValueAndValidity();
    this.customerForm.get('username')?.clearValidators();
    this.customerForm.get('username')?.updateValueAndValidity();
    this.customerForm.get('password')?.clearValidators();
    this.customerForm.get('password')?.updateValueAndValidity();
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedCustomer = null;
  }

  onSubmit(): void {
    this.isSubmitted = true;
    if (this.customerForm.invalid) {
      this.customerForm.markAllAsTouched();
      Swal.fire({
        icon: 'warning',
        title: 'Thông tin chưa hợp lệ',
        text: 'Vui lòng kiểm tra lại các trường thông tin bắt buộc.',
        confirmButtonColor: '#006b68'
      });
      return;
    }

    const rawValue = this.customerForm.getRawValue();

    if (this.isEditing && this.selectedCustomer) {
      const payload: Partial<Customer> = { ...rawValue };
      delete (payload as any).username;
      delete (payload as any).password;
      delete (payload as any).roleId;

      this.adminService.updateCustomer(this.selectedCustomer.id, payload).subscribe({
        next: () => {
          Swal.fire({ icon: 'success', title: 'Cập nhật thành công', timer: 1800, showConfirmButton: false });
          this.closeModal();
          this.loadCustomers();
        },
        error: (err) => Swal.fire({ icon: 'error', title: 'Lỗi', text: err?.error?.message || 'Cập nhật thất bại', confirmButtonColor: '#006b68' })
      });
    } else {
      const payload: CreateCustomerWithAccountRequest = {
        customer: {
          customerName: rawValue.customerName,
          customerType: rawValue.customerType,
          cif: rawValue.cif,
          phone: rawValue.phone,
          email: rawValue.email,
          address: rawValue.address,
          taxCode: rawValue.taxCode,
          businessRegistrationNo: rawValue.businessRegistrationNo,
          representativeName: rawValue.representativeName,
          representativeTitle: rawValue.representativeTitle,
          bankAccountNo: rawValue.bankAccountNo,
          bankName: rawValue.bankName,
          status: rawValue.status
        },
        username: rawValue.username,
        password: rawValue.password,
        roleId: Number(rawValue.roleId)
      };

      this.adminService.createCustomer(payload).subscribe({
        next: () => {
          Swal.fire({ icon: 'success', title: 'Thêm khách hàng thành công', timer: 1800, showConfirmButton: false });
          this.closeModal();
          this.loadCustomers();
        },
        error: (err) => Swal.fire({ icon: 'error', title: 'Lỗi', text: err?.error?.message || 'Thêm khách hàng thất bại', confirmButtonColor: '#006b68' })
      });
    }
  }

  onDelete(customer: Customer): void {
    Swal.fire({
      title: 'Xác nhận xóa',
      html: `Bạn có chắc muốn xóa khách hàng <strong>${customer.customerName}</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    }).then(result => {
      if (result.isConfirmed) {
        this.adminService.deleteCustomer(customer.id).subscribe({
          next: () => {
            Swal.fire({ icon: 'success', title: 'Đã xóa', timer: 1500, showConfirmButton: false });
            this.loadCustomers();
          },
          error: (err) => Swal.fire({ icon: 'error', title: 'Lỗi', text: err?.error?.message || 'Xóa thất bại', confirmButtonColor: '#006b68' })
        });
      }
    });
  }

  getTypeBadge(type?: string): { label: string; cssClass: string } {
    return type === 'DOANH_NGHIEP'
      ? { label: 'Doanh nghiệp', cssClass: 'type-enterprise' }
      : { label: 'Cá nhân', cssClass: 'type-individual' };
  }

  getCountByType(type: string): number {
    return this.customers.filter(c => c.customerType === type).length;
  }
}
