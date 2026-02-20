import { DocumentVehicles } from "./document_vehicles";
import { GuaranteeLetter } from "./guarantee_letter";
import { Invoice } from "./invoice-data.model";

export interface Vehicle {
  id?: number;
  stt?: number;

  vehicleName: string;
  status?: string;
  fundingSource?: string;

  importDate?: string;
  exportDate?: string;

  assetName?: string;
  chassisNumber: string;
  engineNumber: string;
  modelType?: string;
  color: string;
  seats?: number;
  price: number;

  originalCopy?: string;
  importDocs?: string;
  registrationOrderNumber?: string;
  docsDeliveryDate?: string;
  description?: string;
  deadlineLabel?: string;
  createdAt?: string;
  documents?: DocumentVehicles[];
  invoiceId?: Invoice;
  guaranteeLetterDTO?: GuaranteeLetter;
}
