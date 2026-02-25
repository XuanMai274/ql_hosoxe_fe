export interface MortgageContract {

  id?: number;

  contractNumber?: string;
  contractDate?: string;

  totalCollateralValue?: number;
  remainingCollateralValue?: number;
  securityRegistrationNumber?: number;// số đơn đăng kí giao dịch đảm bảo
  personalIdNumber?: number;// định danh cá nhân
  status?: string;

  customerId?: number;
  manufacturerId?: number;

  creditContractIds?: number[];
  guaranteeLetterIds?: number[];

  createdAt?: string;
  updatedAt?: string;
}
