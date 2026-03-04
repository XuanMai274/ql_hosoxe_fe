export interface CreditContract {
  id?: number;

  // ===== Thông tin hợp đồng =====
  contractNumber?: string;
  contractDate?: string;      // yyyy-MM-dd
  expiryDate?: string;

  // ===== Hạn mức tín dụng =====
  creditLimit?: number;           // GHTD
  usedLimit?: number;             // Đã sử dụng thực tế
  remainingLimit?: number;        // Còn lại thực tế

  // ===== Dư nợ chi tiết =====
  guaranteeBalance?: number;      // Dư bảo lãnh thực tế
  vehicleLoanBalance?: number;    // Dư nợ xe thực tế
  realEstateLoanBalance?: number; // Dư nợ BĐS thực tế
  issuedGuaranteeBalance?: number; //dư bảo lãnh phát hành
  issuedRemainingLimit?: number; // còn lại phát hành
  issuedUsedLimit?: number; // đã sử dụng phát hành
  // ===== Quan hệ =====
  mortgageContractIds?: number[];
  guaranteeIds?: number[];
  loanIds?: number[];
  customerId?: number;

  // ===== Trạng thái =====
  status?: string;

  // ===== Audit =====
  createdAt?: string;  // ISO datetime
  updatedAt?: string;  // ISO datetime
}
