import { Invoice } from "./invoice-data.model";
import { Vehicle } from "./vehicle";

export interface CreateInvoiceVehicleRequest {
  invoice: Invoice;
  vehicles: Vehicle[];
}
