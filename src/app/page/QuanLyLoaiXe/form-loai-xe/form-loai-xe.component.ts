import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ManufacturerService } from '../../../service/manufacturer.service';
import { Manufacturer } from '../../../models/manufacturer';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-form-loai-xe',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
    templateUrl: './form-loai-xe.component.html',
    styleUrl: './form-loai-xe.component.css'
})
export class FormLoaiXeComponent implements OnInit {
    manufacturerForm: FormGroup;
    isEditMode = false;
    manufacturerId?: number;
    isLoading = false;
    selectedFile: File | null = null;
    isSaving = false;

    constructor(
        private fb: FormBuilder,
        private manufacturerService: ManufacturerService,
        private route: ActivatedRoute,
        private router: Router,
        private toastr: ToastrService
    ) {
        this.manufacturerForm = this.fb.group({
            code: ['', [Validators.required, Validators.maxLength(50)]],
            name: ['', [Validators.required, Validators.maxLength(255)]],
            logo: ['', [Validators.required]],
            description: ['', [Validators.maxLength(1000)]],
            guaranteeRate: [0.75, [Validators.required, Validators.min(0), Validators.max(1)]],
            templateCode: ['', [Validators.required, Validators.maxLength(50)]]
        });
    }

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.isEditMode = true;
            this.manufacturerId = +id;
            this.loadManufacturer(this.manufacturerId);
        }
    }

    onFileSelected(event: any): void {
        const file = event.target.files[0];
        if (file) {
            this.selectedFile = file;
            // Tạm thời hiển thị tên file hoặc preview nếu cần
            this.manufacturerForm.patchValue({ logo: file.name });
        }
    }

    loadManufacturer(id: number): void {
        this.isLoading = true;
        this.manufacturerService.getById(id).subscribe({
            next: (data) => {
                this.manufacturerForm.patchValue(data);
                this.isLoading = false;
            },
            error: () => {
                this.toastr.error('Lỗi khi tải thông tin loại xe');
                this.isLoading = false;
            }
        });
    }

    onSubmit(): void {
        if (this.manufacturerForm.invalid) {
            this.manufacturerForm.markAllAsTouched();
            this.toastr.warning('Vui lòng kiểm tra lại các trường bắt buộc');
            return;
        }

        this.isSaving = true;

        if (this.selectedFile) {
            // Upload file trước
            this.manufacturerService.uploadLogo(this.selectedFile).subscribe({
                next: (res) => {
                    // Update field logo với URL mới từ server
                    const formData = { ...this.manufacturerForm.value, logo: res.url };
                    this.saveManufacturer(formData);
                },
                error: () => {
                    this.toastr.error('Lỗi khi upload ảnh');
                    this.isSaving = false;
                }
            });
        } else {
            this.saveManufacturer(this.manufacturerForm.value);
        }
    }

    private saveManufacturer(formData: any): void {
        if (this.isEditMode && this.manufacturerId) {
            this.manufacturerService.update(this.manufacturerId, formData).subscribe({
                next: () => {
                    this.toastr.success('Cập nhật loại xe thành công');
                    this.router.navigate(['/manager/loai-xe']);
                },
                error: () => {
                    this.toastr.error('Lỗi khi cập nhật loại xe');
                    this.isSaving = false;
                }
            });
        } else {
            this.manufacturerService.add(formData).subscribe({
                next: () => {
                    this.toastr.success('Thêm loại xe thành công');
                    this.router.navigate(['/manager/loai-xe']);
                },
                error: () => {
                    this.toastr.error('Lỗi khi thêm loại xe');
                    this.isSaving = false;
                }
            });
        }
    }
}
