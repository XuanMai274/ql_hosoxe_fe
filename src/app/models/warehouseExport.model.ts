import { Vehicle } from "./vehicle";

export interface WarehouseExportDTO {
    id?: number;

    exportNumber?: string;
    exportDate?: string;
    requestDate?: string;

    status?: string;

    totalDebtCollection?: number;
    vehicleCount?: number;

    description?: string;

    vehicleIds: number[];
    vehicles?: Vehicle[];

    createdAt?: string;
    createdBy?: string;
    totalCollateralValue?: number;
    realEstateValue?: number;
}