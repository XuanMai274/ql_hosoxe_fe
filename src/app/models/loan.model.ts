import { CreditContract } from "./credit_contract";
import { Customer } from "./customer.model";
import { DisbursementDTO } from "./disbursement.model";
import { GuaranteeLetter } from "./guarantee_letter";
import { Vehicle } from "./vehicle";

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

  loanStatus?: string | any;  // enum từ backend: ACTIVE, PAID, OVERDUE ...
  loanType?: string | any;

  // ===== Relation =====
  customerId?: number | Customer;
  customerDTO?: Customer;     // object khách hàng đầy đủ
  vehicleId?: number;
  guaranteeLetterId?: number;
  guaranteeLetterDTO?: GuaranteeLetter;
  creditContractDTO?: CreditContract;
  disbursementDTO?: DisbursementDTO;
  vehicleDTO?: Vehicle;
  createdAt?: string;
  updatedAt?: string;
}
