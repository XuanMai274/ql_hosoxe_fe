import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService } from '../../../service/admin.service';
import { Customer } from '../../../models/customer.model';
import Swal from 'sweetalert2';

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

  customerForm: FormGroup;

  readonly CUSTOMER_TYPES = [
    { value: 'INDIVIDUAL', label: 'Cá nhân' },
    { value: 'ENTERPRISE', label: 'Doanh nghiệp' }
  ];

  constructor(private adminService: AdminService, private fb: FormBuilder) {
    this.customerForm = this.fb.group({
      customerName: ['', Validators.required],
      customerType: ['INDIVIDUAL', Validators.required],
      cif: [''],
      phone: [''],
      email: ['', Validators.email],
      address: [''],
      taxCode: [''],
      businessRegistrationNo: [''],
      representativeName: [''],
      representativeTitle: [''],
      bankAccountNo: [''],
      bankName: [''],
      status: ['ACTIVE']
    });
  }

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.isLoading = true;
    this.adminService.getCustomers(this.page, this.size, this.searchKeyword).subscribe({
      next: (res: any) => {
        // Hỗ trợ cả PageResponse và mảng trực tiếp
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

  onSearch(): void {
    this.page = 0;
    this.loadCustomers();
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
    this.customerForm.reset({ customerType: 'INDIVIDUAL', status: 'ACTIVE' });
    this.showModal = true;
  }

  openEditModal(customer: Customer): void {
    this.isEditing = true;
    this.selectedCustomer = customer;
    this.customerForm.patchValue({ ...customer });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedCustomer = null;
  }

  onSubmit(): void {
    if (this.customerForm.invalid) {
      this.customerForm.markAllAsTouched();
      return;
    }

    const payload: Partial<Customer> = this.customerForm.value;

    if (this.isEditing && this.selectedCustomer) {
      this.adminService.updateCustomer(this.selectedCustomer.id, payload).subscribe({
        next: () => {
          Swal.fire({ icon: 'success', title: 'Cập nhật thành công', timer: 1800, showConfirmButton: false });
          this.closeModal();
          this.loadCustomers();
        },
        error: (err) => Swal.fire({ icon: 'error', title: 'Lỗi', text: err?.error?.message || 'Cập nhật thất bại', confirmButtonColor: '#006b68' })
      });
    } else {
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
    return type === 'ENTERPRISE'
      ? { label: 'Doanh nghiệp', cssClass: 'type-enterprise' }
      : { label: 'Cá nhân', cssClass: 'type-individual' };
  }

  getCountByType(type: string): number {
    return this.customers.filter(c => c.customerType === type).length;
  }
}
