export interface CreditContract {
  id?: number;

  // ===== Thông tin hợp đồng =====
  contractNumber?: string;
  contractDate?: string;      // yyyy-MM-dd (khuyên dùng ISO để tránh lỗi timezone)

  // ===== Hạn mức tín dụng =====
  creditLimit?: number;           // GHTD
  usedLimit?: number;             // Đã sử dụng
  remainingLimit?: number;        // Còn lại

  // ===== Dư nợ chi tiết =====
  guaranteeBalance?: number;      // Dư bảo lãnh
  vehicleLoanBalance?: number;    // Dư nợ xe
  realEstateLoanBalance?: number; // Dư nợ BĐS

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
