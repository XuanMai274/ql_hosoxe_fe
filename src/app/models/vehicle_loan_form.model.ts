export interface VehicleLoanForm {
  vehicleId: number;
  vihicleName:String;
  chassisNumber: string;
  guaranteeAmount: number;
  loanContractNumber?: string;
  loanTerm?: number;
  loanDate?: Date;
  dueDate?: Date;
}