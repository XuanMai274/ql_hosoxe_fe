export interface Manufacturer {
  id?: number
  code?: string
  name?: string
  logo?: string
  description?: string
  guaranteeRate: number;  // 0.75 | 0.85
  templateCode: string;   // VINFAST_V1 | HYUNDAI_V1
}