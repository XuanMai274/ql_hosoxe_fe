export interface MortgageContract {

  id?: number;

  contractNumber?: string;
  contractDate?: any;
  expiryDate?: any;

  totalCollateralValue?: number;
  remainingCollateralValue?: number;
  securityRegistrationNumber?: string;// số đơn đăng kí giao dịch đảm bảo
  personalIdNumber?: string;// định danh cá nhân
  status?: string;

  customerId?: number;
  customerDTO?: any;
  manufacturerDTO?: { id: number; manufacturerName?: string; templateCode?: string };

  creditContractIds?: number[];
  guaranteeLetterIds?: number[];

  createdAt?: string;
  updatedAt?: string;
}
