import { User, UserRole } from '@/types/user';
import { Asset, AssetStatus, AssetType } from '@/types/asset';
import { Contract, ContractStatus } from '@/types/contract';
import { FinancialRecord, Payment, FinanceType } from '@/types/finance';
import { Maintenance, MaintenanceStatus, MaintenanceType } from '@/types/maintenance';

// Mock Users
export const mockUsers: User[] = [
  {
    id: '1',
    phone: '0812345678',
    password: 'admin123',
    role: 'admin',
    name: 'ผู้ดูแลระบบ',
    email: 'admin@example.com',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    phone: '0823456789',
    password: 'owner123',
    role: 'owner',
    name: 'สมชาย ใจดี',
    email: 'owner@example.com',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    phone: '0834567890',
    password: 'tenant123',
    role: 'tenant',
    name: 'สมหญิง รักดี',
    email: 'tenant@example.com',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

// Mock Assets
export const mockAssets: Asset[] = [
  {
    id: '1',
    ownerId: '2',
    type: 'house',
    name: 'บ้านเดี่ยว 2 ชั้น',
    address: '123 ถนนสุขุมวิท',
    district: 'คลองตัน',
    amphoe: 'วัฒนา',
    province: 'กรุงเทพมหานคร',
    postalCode: '10110',
    size: 150,
    rooms: 3,
    purchasePrice: 5000000,
    currentValue: 6500000,
    status: 'rented',
    images: ['/images/house1.jpg'],
    documents: [],
    latitude: 13.7367,
    longitude: 100.5231,
    description: 'บ้านเดี่ยวสวยงาม 2 ชั้น พร้อมสวน',
    isParent: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    ownerId: '2',
    type: 'condo',
    name: 'คอนโดมิเนียมหรู',
    address: '456 ถนนสีลม',
    district: 'สีลม',
    amphoe: 'บางรัก',
    province: 'กรุงเทพมหานคร',
    postalCode: '10500',
    size: 45,
    rooms: 1,
    purchasePrice: 3000000,
    currentValue: 4200000,
    status: 'available',
    images: ['/images/condo1.jpg'],
    documents: [],
    latitude: 13.7300,
    longitude: 100.5390,
    description: 'คอนโดมิเนียมใจกลางเมือง พร้อมสิ่งอำนวยความสะดวกครบ',
    isParent: false,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
  {
    id: '3',
    ownerId: '2',
    type: 'apartment',
    name: 'อพาร์ทเมนต์',
    address: '789 ถนนพหลโยธิน',
    district: 'จตุจักร',
    amphoe: 'จตุจักร',
    province: 'กรุงเทพมหานคร',
    postalCode: '10900',
    size: 35,
    rooms: 1,
    purchasePrice: 2000000,
    currentValue: 2500000,
    status: 'maintenance',
    images: ['/images/apartment1.jpg'],
    documents: [],
    latitude: 13.8200,
    longitude: 100.5500,
    description: 'อพาร์ทเมนต์สะดวกสบาย ใกล้รถไฟฟ้า',
    isParent: false,
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z',
  },
];

// Mock Contracts
export const mockContracts: Contract[] = [
  {
    id: '1',
    assetId: '1',
    assetName: 'บ้านเดี่ยว 2 ชั้น',
    tenantId: '3',
    tenantName: 'สมหญิง รักดี',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    rentAmount: 25000,
    deposit: 50000,
    insurance: 10000,
    status: 'active',
    documents: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

// Mock Financial Records
export const mockFinancialRecords: FinancialRecord[] = [
  {
    id: '1',
    assetId: '1',
    contractId: '1',
    type: 'income',
    category: 'rent',
    amount: 25000,
    description: 'ค่าเช่าเดือนมกราคม',
    date: '2024-01-05',
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-01-05T00:00:00Z',
  },
  {
    id: '2',
    assetId: '1',
    type: 'expense',
    category: 'repair',
    amount: 5000,
    description: 'ซ่อมแซมประตู',
    date: '2024-01-10',
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z',
  },
];

// Mock Payments
export const mockPayments: Payment[] = [
  {
    id: '1',
    contractId: '1',
    amount: 25000,
    type: 'rent',
    dueDate: '2024-02-05',
    paidDate: '2024-02-03',
    status: 'paid',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-02-03T00:00:00Z',
  },
  {
    id: '2',
    contractId: '1',
    amount: 25000,
    type: 'rent',
    dueDate: '2024-03-05',
    status: 'pending',
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
  },
];

// Mock Maintenance
export const mockMaintenance: Maintenance[] = [
  {
    id: '1',
    assetId: '3',
    assetName: 'อพาร์ทเมนต์',
    type: 'repair',
    title: 'ซ่อมแซมระบบไฟฟ้า',
    description: 'มีปัญหาไฟฟ้าดับบ่อย ต้องตรวจสอบและซ่อมแซม',
    cost: 8000,
    status: 'in_progress',
    reportedBy: '3',
    reportedByName: 'สมหญิง รักดี',
    scheduledDate: '2024-01-15',
    createdAt: '2024-01-12T00:00:00Z',
    updatedAt: '2024-01-12T00:00:00Z',
  },
];

// Helper functions
export const getUserByPhone = (phone: string): User | undefined => {
  return mockUsers.find(user => user.phone === phone);
};

export const getAssetsByOwner = (ownerId: string): Asset[] => {
  return mockAssets.filter(asset => asset.ownerId === ownerId);
};

export const getContractsByTenant = (tenantId: string): Contract[] => {
  return mockContracts.filter(contract => contract.tenantId === tenantId);
};

export const getContractsByAsset = (assetId: string): Contract[] => {
  return mockContracts.filter(contract => contract.assetId === assetId);
};

