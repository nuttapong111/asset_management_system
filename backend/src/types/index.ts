export type UserRole = 'owner' | 'tenant' | 'admin';

export interface User {
  id: string;
  phone: string;
  password: string;
  role: UserRole;
  name: string;
  email?: string;
  avatar?: string;
  address?: {
    houseNumber: string;
    villageNumber?: string;
    street?: string;
    subDistrict: string;
    district: string;
    province: string;
    postalCode: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UserDB {
  id: string;
  phone: string;
  password: string;
  role: UserRole;
  name: string;
  email?: string;
  avatar?: string;
  address?: any;
  created_at: Date;
  updated_at: Date;
}

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
  district: string;
  amphoe: string;
  province: string;
  postalCode: string;
  size: number;
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
  parentAssetId?: string;
  isParent: boolean;
  childAssets?: string[];
  unitNumber?: string;
  totalUnits?: number;
  developmentHistory?: DevelopmentHistory[];
}

export interface AssetDB {
  id: string;
  owner_id: string;
  type: AssetType;
  name: string;
  address: string;
  district: string;
  amphoe: string;
  province: string;
  postal_code: string;
  size: number;
  rooms: number;
  purchase_price: number;
  current_value: number;
  status: AssetStatus;
  images: string[];
  documents: string[];
  latitude?: number;
  longitude?: number;
  description?: string;
  parent_asset_id?: string;
  is_parent: boolean;
  child_assets: string[];
  unit_number?: string;
  total_units?: number;
  development_history?: any;
  created_at: Date;
  updated_at: Date;
}

export type ContractStatus = 'active' | 'expired' | 'terminated' | 'pending';

export interface Contract {
  id: string;
  assetId: string;
  assetName?: string;
  tenantId: string;
  tenantName?: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  deposit: number;
  insurance: number;
  status: ContractStatus;
  documents: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContractDB {
  id: string;
  asset_id: string;
  tenant_id: string;
  start_date: Date;
  end_date: Date;
  rent_amount: number;
  deposit: number;
  insurance: number;
  status: ContractStatus;
  documents: string[];
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export type PaymentStatus = 'pending' | 'paid' | 'overdue';

export interface Payment {
  id: string;
  contractId: string;
  amount: number;
  type: 'rent' | 'deposit' | 'utility' | 'other';
  dueDate: string;
  paidDate?: string;
  status: PaymentStatus;
  proofImages?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PaymentDB {
  id: string;
  contract_id: string;
  amount: number;
  type: string;
  due_date: Date;
  paid_date?: Date;
  status: PaymentStatus;
  proof_images: string[];
  created_at: Date;
  updated_at: Date;
}

export type MaintenanceType = 'repair' | 'routine' | 'emergency';
export type MaintenanceStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface Maintenance {
  id: string;
  assetId: string;
  assetName?: string;
  type: MaintenanceType;
  title: string;
  description: string;
  cost: number;
  status: MaintenanceStatus;
  reportedBy?: string;
  reportedByName?: string;
  scheduledDate?: string;
  completedDate?: string;
  images?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceDB {
  id: string;
  asset_id: string;
  type: MaintenanceType;
  title: string;
  description: string;
  cost: number;
  status: MaintenanceStatus;
  reported_by?: string;
  scheduled_date?: Date;
  completed_date?: Date;
  images: string[];
  created_at: Date;
  updated_at: Date;
}

export type NotificationType = 'payment_proof' | 'payment_due' | 'payment_due_soon' | 'contract_expiring' | 'maintenance_request' | 'payment_overdue' | 'system';
export type NotificationStatus = 'unread' | 'read';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: string;
  status: NotificationStatus;
  createdAt: string;
  readAt?: string;
}

export interface NotificationDB {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  related_id?: string;
  status: NotificationStatus;
  read_at?: Date;
  created_at: Date;
}

