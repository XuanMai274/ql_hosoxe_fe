export interface GuaranteeApplicationVehicle {

  id?: number;

  vehicleName?: string;
  vehicleType?: string;
  color?: string;
  chassisNumber?: string;
  invoiceNumber?: string;
  paymentMethod?: string;
  bankName?: string;

  vehiclePrice?: number;
  guaranteeAmount?: number;
}