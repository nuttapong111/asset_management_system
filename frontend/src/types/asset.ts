export type AssetType = 'house' | 'condo' | 'apartment' | 'land';
export type AssetStatus = 'available' | 'rented' | 'maintenance';

export interface Asset {
  id: string;
  ownerId: string;
  type: AssetType;
  name: string;
  address: string;
  district: string;
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
}

