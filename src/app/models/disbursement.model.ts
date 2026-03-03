import { LoanDTO } from "./loan.model";

export interface DisbursementCustomerDTO {
  id?: number;
  customerName?: string;
  cif?: string;
}

export interface DisbursementMortgageDTO {
  id?: number;
  contractNumber?: string;
  customerDTO?: DisbursementCustomerDTO;
}

export interface DisbursementDTO {

  id?: number;

  // ===== Thông tin tổng thể =====
  loanContractNumber?: string;
  creditContractNumber?: string;
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
  interestRate?: number;            // Lãi suất (%)
  interestAmount?: number;          // Tiền lãi
  totalAmountPaid?: number;         // Tổng tiền đã trả
  withdrawnVehiclesCount?: number;  // Số xe đã rút
  totalVehiclesCount?: number;      // Tổng số xe vay
  status?: string;                  // Trạng thái

  // ===== Quan hệ =====
  creditContractId?: number;
  mortgageContractId?: number;
  mortgageContractDTO?: DisbursementMortgageDTO;

  loans?: LoanDTO[];
}