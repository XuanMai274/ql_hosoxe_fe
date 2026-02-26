import { Manufacturer } from './manufacturer';
import { CreditContract } from './credit_contract';
import { MortgageContract } from './mortgage-contract.model';
import { Customer } from './customer.model';
import { GuaranteeApplicationVehicle } from './guarantee_application_vehicle';

export interface GuaranteeApplication {

  id?: number;

  applicationNumber?: string;
  subGuaranteeContractNumber?: string;

  guaranteeTermDays?: number;
  expiryDate?: string;        

  totalVehicleCount?: number;
  totalVehicleAmount?: number;
  totalGuaranteeAmount?: number;

  status?: string;

  createdAt?: string;        
  approvedAt?: string;

  manufacturerDTO?: Manufacturer;
  creditContractDTO?: CreditContract;
  mortgageContractDTO?: MortgageContract;
  customerDTO?: Customer;

  vehicles?: GuaranteeApplicationVehicle[];
}