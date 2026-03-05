import { DisbursementDTO } from "./disbursement.model";
import { LoanDTO } from "./loan.model";
import { WarehouseImportDTO } from "./warehouseImport.model";

export interface FullProcessResponse {
  warehouseImport: WarehouseImportDTO;
  disbursement: DisbursementDTO;
  loans: LoanDTO[];
}