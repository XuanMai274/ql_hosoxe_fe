export interface GeneralStatistics {
    // 1. Xe (Vehicle)
    totalVehicles: number;
    inWarehouseCount: number;
    returnedToCustomerCount: number;

    // 2. Bảo lãnh (Guarantee)
    totalIssuedGuaranteeBalance: number;
    activeGuaranteeLetterCount: number;
    actualGuaranteeBalance: number;

    // 3. Khoản vay (Loan)
    activeDisbursementCount: number;
    totalVehicleLoanBalance: number;
    totalRealEstateLoanBalance: number;

    manufacturerStats: ManufacturerStats[];
    monthlyStats: MonthlyStats[];
    topCustomers: CustomerStats[];
}

export interface ManufacturerStats {
    name: string;
    count: number;
}

export interface MonthlyStats {
    month: string;
    count: number;
}

export interface CustomerStats {
    name: string;
    count: number;
}
