export interface LoanDTO {

  id?: number;

  // ===== Loan Info =====
  accountNumber?: string;
  loanContractNumber?: string;
  loanTerm?: number;
  loanDate?: string;      // LocalDate → string ISO yyyy-MM-dd
  dueDate?: string;
  loanAmount?: number;
  docId?: string;

  // ===== Payment =====
  lastPaymentDate?: string;
  totalPaidAmount?: number;

  // ===== Business =====
  collateralAndPurpose?: string;
  withdrawnChassisNumber?: string;

  loanStatus?: string;
  loanType?: string;

  // ===== Relation =====
  customerId?: number;
  vehicleId?: number;
  guaranteeLetterId?: number;

  createdAt?: string;
  updatedAt?: string;
}