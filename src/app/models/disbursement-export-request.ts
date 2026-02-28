import { DisbursementDTO } from "./disbursement.model";

export interface DisbursementExportRequest {
    disbursementDTO?: DisbursementDTO
    vehicleIds?: number[];
}