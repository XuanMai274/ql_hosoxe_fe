import { Vehicle } from "./vehicle";

export interface Invoice {
  id?: number;
  invoiceNumber: string;
  invoiceDate: string;
  totalAmount: number;

  createdAt?: string;

  vehicles?: Vehicle[];
}
