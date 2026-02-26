import { Manufacturer } from "./manufacturer";
import { MortgageContract } from "./mortgage-contract.model";

export interface WarehouseImportDTO {
  id: number;
  importNumber: string;
  manufacturerDTO: Manufacturer;
  mortgageContractDTO: MortgageContract;
  vehicleIds: number[];
  createdAt: string; // LocalDateTime -> string ISO
}