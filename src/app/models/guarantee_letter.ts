import { BranchAuthorizedRepresentative } from "./branch-authorized-representative";
import { CreditContract } from "./credit_contract";
import { MortgageContract } from "./mortgage-contract.model";
import { Manufacturer } from "./manufacturer";
import { Customer } from "./customer.model";
import { GuaranteeLetterFile } from "./guarantee_letter_file";

export interface GuaranteeLetter {

    uploading?: boolean;

    id?: number;

    // ===== RELATION =====
    creditContractDTO?: CreditContract;
    mortgageContractDTO?: MortgageContract;
    manufacturerDTO?: Manufacturer;
    branchAuthorizedRepresentativeDTO?: BranchAuthorizedRepresentative;
    customerDTO?: Customer;

    // ===== GUARANTEE CONTRACT =====
    guaranteeContractNumber?: string;
    guaranteeContractDate?: string;      // LocalDate
    guaranteeNoticeNumber?: string;
    guaranteeNoticeDate?: string;        // LocalDate
    referenceCode?: string;

    // ===== GUARANTEE AMOUNT =====
    expectedGuaranteeAmount?: number;
    totalGuaranteeAmount?: number;
    usedAmount?: number;
    remainingAmount?: number;

    // ===== VEHICLE COUNT =====
    expectedVehicleCount?: number;
    importedVehicleCount?: number;
    exportedVehicleCount?: number;

    // ===== SALE CONTRACT =====
    saleContract?: string;
    saleContractAmount?: number;

    // ===== STATUS & AUDIT =====
    status?: string;
    createdAt?: string;   // LocalDateTime
    updatedAt?: string;   // LocalDateTime

    // ===== CHILD =====
    vehicleIds?: number[];
    fileId?: GuaranteeLetterFile;
}
