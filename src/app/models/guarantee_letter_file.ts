export interface GuaranteeLetterFile {
  id?: number;

  // FK logic tới thư bảo lãnh
  guaranteeLetterId: number;

  // ===== FILE METADATA =====
  fileName: string;
  filePath: string;
  fileType?: string;
  fileSize?: number;

  // Kiểm soát toàn vẹn file
  fileHash?: string;

  // Versioning
  version?: number;

  isActive?: boolean;

  createdAt?: string; // ISO string từ backend
}
