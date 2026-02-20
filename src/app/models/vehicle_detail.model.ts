import { Vehicle } from './vehicle';
import { Invoice } from './invoice-data.model';
import { GuaranteeLetter } from './guarantee_letter';

export interface VehicleDetail {
  vehicle: Vehicle;
  invoice: Invoice;
  guaranteeLetter: GuaranteeLetter;
}
