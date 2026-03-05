import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GuaranteeLetterService } from '../../../service/guarantee-letter.service';
import { GuaranteeLetter } from '../../../models/guarantee_letter';
import { PageResponse } from '../../../models/page-response';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-bao-lanh-hieu-luc',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './bao-lanh-hieu-luc.component.html',
    styleUrls: ['./bao-lanh-hieu-luc.component.css']
})
export class BaoLanhHieuLucComponent implements OnInit {
    guaranteeLetters: GuaranteeLetter[] = [];
    page = 0;
    size = 10;
    totalElements = 0;
    totalPages = 0;

    constructor(
        private guaranteeLetterService: GuaranteeLetterService,
        private toastr: ToastrService
    ) { }

    ngOnInit(): void {
        this.loadData();
    }

    loadData(): void {
        this.guaranteeLetterService.getActiveGuaranteesForCustomer(this.page, this.size).subscribe({
            next: (res: PageResponse<GuaranteeLetter>) => {
                this.guaranteeLetters = res.content;
                this.totalElements = res.totalElements;
                this.totalPages = res.totalPages;
            },
            error: (err) => {
                console.error(err);
                this.toastr.error('Không thể tải danh sách bảo lãnh');
            }
        });
    }

    onPageChange(page: number): void {
        this.page = page;
        this.loadData();
    }

    viewDocument(guarantee: GuaranteeLetter): void {
        if (guarantee.fileId && guarantee.fileId.id) {
            this.guaranteeLetterService.previewPdfCustomer(guarantee.fileId.id).subscribe({
                next: (blob) => {
                    const url = window.URL.createObjectURL(blob);
                    window.open(url, '_blank');
                },
                error: (err) => {
                    console.error('Lỗi khi xem file:', err);
                    this.toastr.error('Không thể tải file PDF');
                }
            });
        }
    }

    getPages(): number[] {
        return Array.from({ length: this.totalPages }, (_, i) => i);
    }
}
