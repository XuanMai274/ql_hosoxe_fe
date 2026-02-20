import { GuaranteeLetter } from "./guarantee_letter";
import { XuatThuBaoLanh } from "./xuat-thu-bao-lanh";

export interface ExportDeXuatRequest {
    guaranteeLetter: GuaranteeLetter;
    exportData: XuatThuBaoLanh;
}