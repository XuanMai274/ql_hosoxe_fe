import { LoanDTO } from "./loan.model";

export interface DisbursementDTO {

  id?: number;

  // ===== Thông tin tổng thể =====
  loanContractNumber?: string;
  creditLimit?: number;
  usedLimit?: number;
  remainingLimit?: number;
  issuedGuaranteeBalance?: number;
  vehicleLoanBalance?: number;
  realEstateLoanBalance?: number;

  totalCollateralValue?: number;
  realEstateValue?: number;
  collateralValueAfterFactor?: number;
  realEstateValueAfterFactor?: number;

  disbursementAmount?: number;
  vehicleCount?: number;

  disbursementDate?: string;
  createdAt?: string;
  updatedAt?: string;
  loanTerm?: number;
  startDate?: Date;
  dueDate?: Date;
  // ===== Quan hệ =====
  creditContractId?: number;
  mortgageContractId?: number;

  loans?: LoanDTO[];
}