import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatisticsService } from '../../service/statistics.service';
import { GeneralStatistics } from '../../models/general_statistics.model';

@Component({
    selector: 'app-thong-ke',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './thong-ke.component.html',
    styleUrl: './thong-ke.component.css'
})
export class ThongKeComponent implements OnInit {
    stats: GeneralStatistics | null = null;
    isLoading = true;

    constructor(private statisticsService: StatisticsService) { }

    ngOnInit(): void {
        this.loadStatistics();
    }

    loadStatistics(): void {
        this.isLoading = true;
        this.statisticsService.getGeneralStatistics().subscribe({
            next: (data) => {
                this.stats = data;
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading stats:', err);
                this.isLoading = false;
            }
        });
    }

    getPercentage(count: number, total: number): number {
        if (!total) return 0;
        return Math.round((count / total) * 100);
    }
}
