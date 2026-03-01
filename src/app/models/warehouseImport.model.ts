import { Manufacturer } from "./manufacturer";
import { MortgageContract } from "./mortgage-contract.model";
import { Vehicle } from "./vehicle";

export interface WarehouseImportDTO {
  id: number;
  importNumber: string;
  manufacturerDTO?: Manufacturer;
  mortgageContractDTO?: MortgageContract;
  vehicleIds: number[];
  vehicles?: Vehicle[]; // danh sách xe đầy đủ cho view chi tiết
  vehicleCount?: number;
  createdAt: string; // LocalDateTime -> string ISO
}
