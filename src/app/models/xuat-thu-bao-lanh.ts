export interface XuatThuBaoLanh {
    totalGuaranteeAmount?: number;       // GHTD đã sử dụng
    usedAmount?: number;                 // dư nợ vay tiền còn lại
    guaranteeBalance?: number;           // số dư cấp bảo lãnh
    shortTermLoanBalance?: number;       // số dư vay ngắn hạn khác
    remainingAmount?: number;            // GHTD còn được sử dụng
}