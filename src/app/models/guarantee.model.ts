export interface Guarantee {
    id?: number;
    vehicleId?: number;
    guaranteeNumber: string;
    guaranteeDate: string;
    amount: number;
    remainingGuaranteeBalance: number;
    ref?: string;
    letterNumber?: string;
    letterDate?: string;
    paymentDate?: string;
    createdAt?: string;
    fundingSource?: string;
}