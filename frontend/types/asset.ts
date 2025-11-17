export type AssetType = 'house' | 'condo' | 'apartment' | 'land';
export type AssetStatus = 'available' | 'rented' | 'maintenance';

export interface DevelopmentHistory {
  date: string;
  action: 'land_purchased' | 'construction_started' | 'construction_completed' | 'units_created';
  description: string;
}

export interface Asset {
  id: string;
  ownerId: string;
  type: AssetType;
  name: string;
  address: string;
  district: string; // แขวง/ตำบล
  amphoe: string; // อำเภอ/เขต
  province: string;
  postalCode: string;
  size: number; // ตารางเมตร
  rooms: number;
  purchasePrice: number;
  currentValue: number;
  status: AssetStatus;
  images: string[];
  documents: string[];
  latitude?: number;
  longitude?: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
  
  // Hierarchical Structure
  parentAssetId?: string;        // ID ของที่ดินหลัก (ถ้าเป็นห้องเช่า)
  isParent: boolean;             // true = ที่ดินหลัก, false = ห้องเช่า
  childAssets?: string[];        // Array of child asset IDs (ถ้าเป็นที่ดินหลัก)
  unitNumber?: string;          // เลขห้อง (เช่น "101", "102") สำหรับห้องเช่า
  totalUnits?: number;          // จำนวนห้องทั้งหมด (สำหรับที่ดินหลัก)
  developmentHistory?: DevelopmentHistory[]; // ประวัติการพัฒนา
}

