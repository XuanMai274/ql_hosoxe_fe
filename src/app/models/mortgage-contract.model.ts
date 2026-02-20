export interface MortgageContract {

  id?: number;

  contractNumber?: string;
  contractDate?: string;

  totalCollateralValue?: number;
  remainingCollateralValue?: number;

  status?: string;

  customerId?: number;
  manufacturerId?: number;

  creditContractIds?: number[];
  guaranteeLetterIds?: number[];

  createdAt?: string;
  updatedAt?: string;
}
