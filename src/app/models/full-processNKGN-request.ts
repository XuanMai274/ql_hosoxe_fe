import { DisbursementDTO } from "./disbursement.model";

export interface FullProcessNKGNRequest {
  warehouseRequest: {
    vehicleIds: number[];
    totalCollateralValue: number;
    totalOutstandingBalance: number;
  };
  disbursementRequest: DisbursementDTO;
}