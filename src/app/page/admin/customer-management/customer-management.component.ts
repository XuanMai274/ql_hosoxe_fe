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
  filteredCustomers: Customer[] = [];
  isLoading = false;
  searchKeyword = '';

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
    this.adminService.getCustomers().subscribe({
      next: (data) => {
        this.customers = data;
        this.filteredCustomers = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        Swal.fire({ icon: 'error', title: 'Lỗi', text: err?.error?.message || 'Không thể tải danh sách khách hàng', confirmButtonColor: '#006b68' });
      }
    });
  }

  onSearch(): void {
    const kw = this.searchKeyword.toLowerCase().trim();
    if (!kw) {
      this.filteredCustomers = this.customers;
    } else {
      this.filteredCustomers = this.customers.filter(c =>
        c.customerName?.toLowerCase().includes(kw) ||
        c.cif?.toLowerCase().includes(kw) ||
        c.phone?.includes(kw) ||
        c.email?.toLowerCase().includes(kw) ||
        c.taxCode?.toLowerCase().includes(kw)
      );
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
