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
  {
    id: '4',
    ownerId: '2',
    type: 'house',
    name: 'บ้านเดี่ยว 1 ชั้น',
    address: '321 ถนนรัชดาภิเษก',
    district: 'ห้วยขวาง',
    province: 'กรุงเทพมหานคร',
    postalCode: '10310',
    size: 120,
    rooms: 2,
    purchasePrice: 4000000,
    currentValue: 5200000,
    status: 'available',
    images: [],
    documents: [],
    latitude: 13.7800,
    longitude: 100.5700,
    description: 'บ้านเดี่ยว 1 ชั้น สะดวกสบาย',
    isParent: false,
    createdAt: '2024-01-04T00:00:00Z',
    updatedAt: '2024-01-04T00:00:00Z',
  },
  {
    id: '5',
    ownerId: '2',
    type: 'condo',
    name: 'คอนโดมิเนียมกลางเมือง',
    address: '654 ถนนเพชรบุรี',
    district: 'ราชเทวี',
    province: 'กรุงเทพมหานคร',
    postalCode: '10400',
    size: 50,
    rooms: 2,
    purchasePrice: 3500000,
    currentValue: 4800000,
    status: 'rented',
    images: [],
    documents: [],
    latitude: 13.7500,
    longitude: 100.5400,
    description: 'คอนโดมิเนียมใจกลางเมือง',
    isParent: false,
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-01-05T00:00:00Z',
  },
  {
    id: '6',
    ownerId: '2',
    type: 'apartment',
    name: 'อพาร์ทเมนต์ใกล้ BTS',
    address: '987 ถนนอโศก',
    district: 'วัฒนา',
    province: 'กรุงเทพมหานคร',
    postalCode: '10110',
    size: 40,
    rooms: 1,
    purchasePrice: 2500000,
    currentValue: 3000000,
    status: 'available',
    images: [],
    documents: [],
    latitude: 13.7400,
    longitude: 100.5600,
    description: 'อพาร์ทเมนต์ใกล้ BTS อโศก',
    isParent: false,
    createdAt: '2024-01-06T00:00:00Z',
    updatedAt: '2024-01-06T00:00:00Z',
  },
  // ที่ดินเปล่าที่พัฒนาเป็นห้องเช่า 10 ห้อง
  {
    id: '7',
    ownerId: '2',
    type: 'land',
    name: 'ที่ดินแปลง A - พัฒนาเป็นห้องเช่า',
    address: '999 ถนนรัชดาภิเษก',
    district: 'ห้วยขวาง',
    province: 'กรุงเทพมหานคร',
    postalCode: '10310',
    size: 500, // ตร.ม.
    rooms: 0,
    purchasePrice: 10000000,
    currentValue: 15000000,
    status: 'rented', // มีห้องเช่าบางห้อง
    images: [],
    documents: [
      'https://example.com/documents/deed_land_A.pdf',
      'https://example.com/documents/tax_land_A.pdf',
      'https://example.com/documents/insurance_land_A.pdf',
    ],
    latitude: 13.7900,
    longitude: 100.5800,
    description: 'ที่ดินเปล่าที่พัฒนาเป็นห้องเช่า 10 ห้อง',
    isParent: true,
    totalUnits: 10,
    childAssets: ['8', '9', '10', '11', '12', '13', '14', '15', '16', '17'],
    developmentHistory: [
      {
        date: '2024-01-01T00:00:00Z',
        action: 'land_purchased',
        description: 'ซื้อที่ดินเปล่า',
      },
      {
        date: '2024-02-01T00:00:00Z',
        action: 'construction_started',
        description: 'เริ่มก่อสร้างห้องเช่า',
      },
      {
        date: '2024-05-01T00:00:00Z',
        action: 'construction_completed',
        description: 'ก่อสร้างเสร็จสิ้น',
      },
      {
        date: '2024-05-15T00:00:00Z',
        action: 'units_created',
        description: 'สร้างห้องเช่า 10 ห้อง',
      },
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-05-15T00:00:00Z',
  },
  // ห้องเช่า 10 ห้อง (5 ห้องเช่าแล้ว, 5 ห้องว่าง)
  {
    id: '8',
    ownerId: '2',
    type: 'apartment',
    name: 'ที่ดินแปลง A - พัฒนาเป็นห้องเช่า - ห้อง 101',
    address: '999 ถนนรัชดาภิเษก',
    district: 'ห้วยขวาง',
    province: 'กรุงเทพมหานคร',
    postalCode: '10310',
    size: 30,
    rooms: 1,
    purchasePrice: 0,
    currentValue: 1500000,
    status: 'rented',
    images: [],
    documents: [],
    latitude: 13.7900,
    longitude: 100.5800,
    description: 'ห้องเช่า 101 ในที่ดินแปลง A',
    isParent: false,
    parentAssetId: '7',
    unitNumber: '101',
    createdAt: '2024-05-15T00:00:00Z',
    updatedAt: '2024-05-15T00:00:00Z',
  },
  {
    id: '9',
    ownerId: '2',
    type: 'apartment',
    name: 'ที่ดินแปลง A - พัฒนาเป็นห้องเช่า - ห้อง 102',
    address: '999 ถนนรัชดาภิเษก',
    district: 'ห้วยขวาง',
    province: 'กรุงเทพมหานคร',
    postalCode: '10310',
    size: 30,
    rooms: 1,
    purchasePrice: 0,
    currentValue: 1500000,
    status: 'rented',
    images: [],
    documents: [],
    latitude: 13.7900,
    longitude: 100.5800,
    description: 'ห้องเช่า 102 ในที่ดินแปลง A',
    isParent: false,
    parentAssetId: '7',
    unitNumber: '102',
    createdAt: '2024-05-15T00:00:00Z',
    updatedAt: '2024-05-15T00:00:00Z',
  },
  {
    id: '10',
    ownerId: '2',
    type: 'apartment',
    name: 'ที่ดินแปลง A - พัฒนาเป็นห้องเช่า - ห้อง 103',
    address: '999 ถนนรัชดาภิเษก',
    district: 'ห้วยขวาง',
    province: 'กรุงเทพมหานคร',
    postalCode: '10310',
    size: 30,
    rooms: 1,
    purchasePrice: 0,
    currentValue: 1500000,
    status: 'rented',
    images: [],
    documents: [],
    latitude: 13.7900,
    longitude: 100.5800,
    description: 'ห้องเช่า 103 ในที่ดินแปลง A',
    isParent: false,
    parentAssetId: '7',
    unitNumber: '103',
    createdAt: '2024-05-15T00:00:00Z',
    updatedAt: '2024-05-15T00:00:00Z',
  },
  {
    id: '11',
    ownerId: '2',
    type: 'apartment',
    name: 'ที่ดินแปลง A - พัฒนาเป็นห้องเช่า - ห้อง 104',
    address: '999 ถนนรัชดาภิเษก',
    district: 'ห้วยขวาง',
    province: 'กรุงเทพมหานคร',
    postalCode: '10310',
    size: 30,
    rooms: 1,
    purchasePrice: 0,
    currentValue: 1500000,
    status: 'rented',
    images: [],
    documents: [],
    latitude: 13.7900,
    longitude: 100.5800,
    description: 'ห้องเช่า 104 ในที่ดินแปลง A',
    isParent: false,
    parentAssetId: '7',
    unitNumber: '104',
    createdAt: '2024-05-15T00:00:00Z',
    updatedAt: '2024-05-15T00:00:00Z',
  },
  {
    id: '12',
    ownerId: '2',
    type: 'apartment',
    name: 'ที่ดินแปลง A - พัฒนาเป็นห้องเช่า - ห้อง 105',
    address: '999 ถนนรัชดาภิเษก',
    district: 'ห้วยขวาง',
    province: 'กรุงเทพมหานคร',
    postalCode: '10310',
    size: 30,
    rooms: 1,
    purchasePrice: 0,
    currentValue: 1500000,
    status: 'rented',
    images: [],
    documents: [],
    latitude: 13.7900,
    longitude: 100.5800,
    description: 'ห้องเช่า 105 ในที่ดินแปลง A',
    isParent: false,
    parentAssetId: '7',
    unitNumber: '105',
    createdAt: '2024-05-15T00:00:00Z',
    updatedAt: '2024-05-15T00:00:00Z',
  },
  {
    id: '13',
    ownerId: '2',
    type: 'apartment',
    name: 'ที่ดินแปลง A - พัฒนาเป็นห้องเช่า - ห้อง 106',
    address: '999 ถนนรัชดาภิเษก',
    district: 'ห้วยขวาง',
    province: 'กรุงเทพมหานคร',
    postalCode: '10310',
    size: 30,
    rooms: 1,
    purchasePrice: 0,
    currentValue: 1500000,
    status: 'available',
    images: [],
    documents: [],
    latitude: 13.7900,
    longitude: 100.5800,
    description: 'ห้องเช่า 106 ในที่ดินแปลง A',
    isParent: false,
    parentAssetId: '7',
    unitNumber: '106',
    createdAt: '2024-05-15T00:00:00Z',
    updatedAt: '2024-05-15T00:00:00Z',
  },
  {
    id: '14',
    ownerId: '2',
    type: 'apartment',
    name: 'ที่ดินแปลง A - พัฒนาเป็นห้องเช่า - ห้อง 107',
    address: '999 ถนนรัชดาภิเษก',
    district: 'ห้วยขวาง',
    province: 'กรุงเทพมหานคร',
    postalCode: '10310',
    size: 30,
    rooms: 1,
    purchasePrice: 0,
    currentValue: 1500000,
    status: 'available',
    images: [],
    documents: [],
    latitude: 13.7900,
    longitude: 100.5800,
    description: 'ห้องเช่า 107 ในที่ดินแปลง A',
    isParent: false,
    parentAssetId: '7',
    unitNumber: '107',
    createdAt: '2024-05-15T00:00:00Z',
    updatedAt: '2024-05-15T00:00:00Z',
  },
  {
    id: '15',
    ownerId: '2',
    type: 'apartment',
    name: 'ที่ดินแปลง A - พัฒนาเป็นห้องเช่า - ห้อง 108',
    address: '999 ถนนรัชดาภิเษก',
    district: 'ห้วยขวาง',
    province: 'กรุงเทพมหานคร',
    postalCode: '10310',
    size: 30,
    rooms: 1,
    purchasePrice: 0,
    currentValue: 1500000,
    status: 'available',
    images: [],
    documents: [],
    latitude: 13.7900,
    longitude: 100.5800,
    description: 'ห้องเช่า 108 ในที่ดินแปลง A',
    isParent: false,
    parentAssetId: '7',
    unitNumber: '108',
    createdAt: '2024-05-15T00:00:00Z',
    updatedAt: '2024-05-15T00:00:00Z',
  },
  {
    id: '16',
    ownerId: '2',
    type: 'apartment',
    name: 'ที่ดินแปลง A - พัฒนาเป็นห้องเช่า - ห้อง 109',
    address: '999 ถนนรัชดาภิเษก',
    district: 'ห้วยขวาง',
    province: 'กรุงเทพมหานคร',
    postalCode: '10310',
    size: 30,
    rooms: 1,
    purchasePrice: 0,
    currentValue: 1500000,
    status: 'available',
    images: [],
    documents: [],
    latitude: 13.7900,
    longitude: 100.5800,
    description: 'ห้องเช่า 109 ในที่ดินแปลง A',
    isParent: false,
    parentAssetId: '7',
    unitNumber: '109',
    createdAt: '2024-05-15T00:00:00Z',
    updatedAt: '2024-05-15T00:00:00Z',
  },
  {
    id: '17',
    ownerId: '2',
    type: 'apartment',
    name: 'ที่ดินแปลง A - พัฒนาเป็นห้องเช่า - ห้อง 110',
    address: '999 ถนนรัชดาภิเษก',
    district: 'ห้วยขวาง',
    province: 'กรุงเทพมหานคร',
    postalCode: '10310',
    size: 30,
    rooms: 1,
    purchasePrice: 0,
    currentValue: 1500000,
    status: 'available',
    images: [],
    documents: [],
    latitude: 13.7900,
    longitude: 100.5800,
    description: 'ห้องเช่า 110 ในที่ดินแปลง A',
    isParent: false,
    parentAssetId: '7',
    unitNumber: '110',
    createdAt: '2024-05-15T00:00:00Z',
    updatedAt: '2024-05-15T00:00:00Z',
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
  // สัญญาเช่าห้อง 101-105 (5 ห้องที่เช่าแล้ว)
  {
    id: '2',
    assetId: '8',
    assetName: 'ที่ดินแปลง A - พัฒนาเป็นห้องเช่า - ห้อง 101',
    tenantId: '3',
    tenantName: 'สมหญิง รักดี',
    startDate: '2024-06-01',
    endDate: '2025-05-31',
    rentAmount: 5000,
    deposit: 10000,
    insurance: 5000,
    status: 'active',
    documents: [],
    createdAt: '2024-06-01T00:00:00Z',
    updatedAt: '2024-06-01T00:00:00Z',
  },
  {
    id: '3',
    assetId: '9',
    assetName: 'ที่ดินแปลง A - พัฒนาเป็นห้องเช่า - ห้อง 102',
    tenantId: '3',
    tenantName: 'สมหญิง รักดี',
    startDate: '2024-06-01',
    endDate: '2025-05-31',
    rentAmount: 5000,
    deposit: 10000,
    insurance: 5000,
    status: 'active',
    documents: [],
    createdAt: '2024-06-01T00:00:00Z',
    updatedAt: '2024-06-01T00:00:00Z',
  },
  {
    id: '4',
    assetId: '10',
    assetName: 'ที่ดินแปลง A - พัฒนาเป็นห้องเช่า - ห้อง 103',
    tenantId: '3',
    tenantName: 'สมหญิง รักดี',
    startDate: '2024-06-01',
    endDate: '2025-05-31',
    rentAmount: 5000,
    deposit: 10000,
    insurance: 5000,
    status: 'active',
    documents: [],
    createdAt: '2024-06-01T00:00:00Z',
    updatedAt: '2024-06-01T00:00:00Z',
  },
  {
    id: '5',
    assetId: '11',
    assetName: 'ที่ดินแปลง A - พัฒนาเป็นห้องเช่า - ห้อง 104',
    tenantId: '3',
    tenantName: 'สมหญิง รักดี',
    startDate: '2024-06-01',
    endDate: '2025-05-31',
    rentAmount: 5000,
    deposit: 10000,
    insurance: 5000,
    status: 'active',
    documents: [],
    createdAt: '2024-06-01T00:00:00Z',
    updatedAt: '2024-06-01T00:00:00Z',
  },
  {
    id: '6',
    assetId: '12',
    assetName: 'ที่ดินแปลง A - พัฒนาเป็นห้องเช่า - ห้อง 105',
    tenantId: '3',
    tenantName: 'สมหญิง รักดี',
    startDate: '2024-06-01',
    endDate: '2025-05-31',
    rentAmount: 5000,
    deposit: 10000,
    insurance: 5000,
    status: 'active',
    documents: [],
    createdAt: '2024-06-01T00:00:00Z',
    updatedAt: '2024-06-01T00:00:00Z',
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
  {
    id: '2',
    assetId: '1',
    assetName: 'บ้านเดี่ยว 2 ชั้น',
    type: 'repair',
    title: 'แจ้งซ่อมประตูหน้าต่าง',
    description: 'ประตูหน้าต่างมีเสียงดังเมื่อเปิด-ปิด ต้องการปรับแต่ง',
    cost: 2000,
    status: 'pending',
    reportedBy: '3',
    reportedByName: 'สมหญิง รักดี',
    scheduledDate: '2024-02-20',
    createdAt: '2024-02-10T00:00:00Z',
    updatedAt: '2024-02-10T00:00:00Z',
  },
  {
    id: '3',
    assetId: '5',
    assetName: 'คอนโดมิเนียมกลางเมือง',
    type: 'repair',
    title: 'แจ้งซ่อมเครื่องปรับอากาศ',
    description: 'เครื่องปรับอากาศไม่เย็น ต้องการตรวจสอบและเติมน้ำยา',
    cost: 3000,
    status: 'pending',
    reportedBy: '3',
    reportedByName: 'สมหญิง รักดี',
    scheduledDate: '2024-02-25',
    createdAt: '2024-02-12T00:00:00Z',
    updatedAt: '2024-02-12T00:00:00Z',
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

// Contract management functions
export const addContract = (contract: Omit<Contract, 'id' | 'createdAt' | 'updatedAt'>): Contract => {
  // Check if there's an active contract for this asset
  const activeContract = mockContracts.find(
    c => c.assetId === contract.assetId && c.status === 'active'
  );
  
  // If there's an active contract, terminate it
  if (activeContract) {
    activeContract.status = 'terminated';
    activeContract.updatedAt = new Date().toISOString();
  }
  
  const newContract: Contract = {
    ...contract,
    id: `contract_${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  mockContracts.push(newContract);
  return newContract;
};

export const updateContract = (id: string, updates: Partial<Contract>): Contract | null => {
  const contractIndex = mockContracts.findIndex(c => c.id === id);
  if (contractIndex === -1) return null;
  
  const contract = mockContracts[contractIndex];
  
  // If updating status to 'active', check if there's another active contract for this asset
  if (updates.status === 'active' && contract.assetId) {
    const activeContract = mockContracts.find(
      c => c.assetId === contract.assetId && c.status === 'active' && c.id !== id
    );
    
    if (activeContract) {
      activeContract.status = 'terminated';
      activeContract.updatedAt = new Date().toISOString();
    }
  }
  
  const updatedContract = {
    ...contract,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  mockContracts[contractIndex] = updatedContract;
  return updatedContract;
};

export const terminateContract = (id: string): Contract | null => {
  const contract = mockContracts.find(c => c.id === id);
  if (!contract) return null;
  
  contract.status = 'terminated';
  contract.updatedAt = new Date().toISOString();
  
  return contract;
};

export const getActiveContractByAsset = (assetId: string): Contract | undefined => {
  return mockContracts.find(c => c.assetId === assetId && c.status === 'active');
};

// Asset management functions
export const addAsset = (asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>): Asset => {
  const newAsset: Asset = {
    ...asset,
    id: `asset_${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  mockAssets.push(newAsset);
  return newAsset;
};

export const updateAsset = (id: string, updates: Partial<Asset>): Asset | null => {
  const assetIndex = mockAssets.findIndex(a => a.id === id);
  if (assetIndex === -1) return null;
  
  const updatedAsset = {
    ...mockAssets[assetIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  mockAssets[assetIndex] = updatedAsset;
  return updatedAsset;
};

// Hierarchical Asset Management Functions
export const getChildAssets = (parentAssetId: string): Asset[] => {
  return mockAssets.filter(a => a.parentAssetId === parentAssetId);
};

export const getParentAsset = (childAssetId: string): Asset | null => {
  const child = mockAssets.find(a => a.id === childAssetId);
  if (!child?.parentAssetId) return null;
  return mockAssets.find(a => a.id === child.parentAssetId) || null;
};

export interface CreateUnitsConfig {
  numberOfUnits: number;
  unitSize: number;
  rooms: number;
  baseRentAmount?: number;
  unitPrefix?: string; // เช่น "101", "201" หรือ "A", "B"
}

export const createUnitsFromParent = (
  parentAssetId: string,
  config: CreateUnitsConfig
): Asset[] => {
  const parentAsset = mockAssets.find(a => a.id === parentAssetId);
  if (!parentAsset) {
    throw new Error('Parent asset not found');
  }

  if (!parentAsset.isParent) {
    throw new Error('Asset is not a parent asset');
  }

  const createdUnits: Asset[] = [];
  const unitPrefix = config.unitPrefix || '1';
  const startNumber = parseInt(unitPrefix) || 1;

  for (let i = 0; i < config.numberOfUnits; i++) {
    const unitNumber = String(startNumber + i).padStart(3, '0');
    const unitName = `${parentAsset.name} - ห้อง ${unitNumber}`;

    const newUnit: Asset = {
      id: `asset_${Date.now()}_${i}`,
      ownerId: parentAsset.ownerId,
      type: 'apartment',
      name: unitName,
      address: parentAsset.address,
      district: parentAsset.district,
      province: parentAsset.province,
      postalCode: parentAsset.postalCode,
      size: config.unitSize,
      rooms: config.rooms,
      purchasePrice: 0, // ห้องเช่าไม่มีราคาซื้อแยก
      currentValue: config.unitSize * 50000, // ประมาณการ
      status: 'available',
      images: [],
      documents: [],
      latitude: parentAsset.latitude,
      longitude: parentAsset.longitude,
      description: `ห้องเช่า ${unitNumber} ใน${parentAsset.name}`,
      isParent: false,
      parentAssetId: parentAssetId,
      unitNumber: unitNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockAssets.push(newUnit);
    createdUnits.push(newUnit);
  }

  // Update parent asset
  const childAssetIds = createdUnits.map(u => u.id);
  const existingChildIds = parentAsset.childAssets || [];
  const updatedChildAssets = [...existingChildIds, ...childAssetIds];

  updateAsset(parentAssetId, {
    totalUnits: (parentAsset.totalUnits || 0) + config.numberOfUnits,
    childAssets: updatedChildAssets,
    developmentHistory: [
      ...(parentAsset.developmentHistory || []),
      {
        date: new Date().toISOString(),
        action: 'units_created',
        description: `สร้างห้องเช่า ${config.numberOfUnits} ห้อง`,
      },
    ],
  });

  return createdUnits;
};

// Calculate total income from parent asset (including all child units)
export const getTotalIncomeFromParent = (parentAssetId: string): number => {
  const parentAsset = mockAssets.find(a => a.id === parentAssetId);
  if (!parentAsset) return 0;

  const childAssets = getChildAssets(parentAssetId);
  const allAssetIds = [parentAssetId, ...childAssets.map(a => a.id)];

  const contracts = mockContracts.filter(c => 
    allAssetIds.includes(c.assetId) && c.status === 'active'
  );

  return contracts.reduce((sum, contract) => sum + contract.rentAmount, 0);
};

// Calculate occupancy rate for parent asset
export const getOccupancyRate = (parentAssetId: string): number => {
  const parentAsset = mockAssets.find(a => a.id === parentAssetId);
  if (!parentAsset || !parentAsset.totalUnits || parentAsset.totalUnits === 0) {
    return 0;
  }

  const childAssets = getChildAssets(parentAssetId);
  const rentedCount = childAssets.filter(a => a.status === 'rented').length;

  return (rentedCount / parentAsset.totalUnits) * 100;
};

// Payment management functions
export const approvePayment = (paymentId: string): Payment | null => {
  const payment = mockPayments.find(p => p.id === paymentId);
  if (!payment) return null;
  
  if (payment.status === 'paid') {
    return payment; // Already paid
  }
  
  payment.status = 'paid';
  payment.paidDate = new Date().toISOString().split('T')[0];
  payment.updatedAt = new Date().toISOString();
  
  return payment;
};

export const updatePayment = (id: string, updates: Partial<Payment>): Payment | null => {
  const paymentIndex = mockPayments.findIndex(p => p.id === id);
  if (paymentIndex === -1) return null;
  
  const payment = mockPayments[paymentIndex];
  const updatedPayment = {
    ...payment,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  mockPayments[paymentIndex] = updatedPayment;
  return updatedPayment;
};

// Notification management
import type { Notification } from '@/types/notification';

export const mockNotifications: Notification[] = [];

export const addNotification = (notification: Omit<Notification, 'id' | 'createdAt'>): Notification => {
  const newNotification: Notification = {
    ...notification,
    id: `notif_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  mockNotifications.push(newNotification);
  return newNotification;
};

export const getNotificationsByUser = (userId: string): Notification[] => {
  return mockNotifications.filter(n => n.userId === userId);
};

export const getUnreadNotificationsCount = (userId: string): number => {
  return mockNotifications.filter(n => n.userId === userId && n.status === 'unread').length;
};

export const markNotificationAsRead = (notificationId: string): Notification | null => {
  const notification = mockNotifications.find(n => n.id === notificationId);
  if (!notification) return null;
  
  notification.status = 'read';
  notification.readAt = new Date().toISOString();
  return notification;
};

export const markAllNotificationsAsRead = (userId: string): void => {
  mockNotifications
    .filter(n => n.userId === userId && n.status === 'unread')
    .forEach(n => {
      n.status = 'read';
      n.readAt = new Date().toISOString();
    });
};

// Function to notify owner when tenant uploads payment proof
export const notifyOwnerPaymentProof = (payment: Payment, contract: Contract, asset: Asset): void => {
  // Find owner of the asset
  const ownerId = asset.ownerId;
  
  addNotification({
    userId: ownerId,
    type: 'payment_proof',
    title: 'มีหลักฐานการชำระเงินใหม่',
    message: `ผู้เช่า ${contract.tenantName} ได้แนบหลักฐานการชำระเงินจำนวน ${payment.amount.toLocaleString('th-TH')} บาท สำหรับ${asset.name}`,
    relatedId: payment.id,
    status: 'unread',
  });
};

// Payment notification functions
export const notifyPaymentDue = (payment: Payment, contract: Contract, asset: Asset): void => {
  const ownerId = asset.ownerId;
  const tenantId = contract.tenantId;
  
  // Notify owner
  addNotification({
    userId: ownerId,
    type: 'payment_overdue',
    title: 'มีค่าเช่าถึงกำหนดชำระ',
    message: `ค่าเช่าจำนวน ${payment.amount.toLocaleString('th-TH')} บาท สำหรับ${asset.name} ถึงกำหนดชำระแล้ว (กำหนดชำระ: ${new Date(payment.dueDate).toLocaleDateString('th-TH')})`,
    relatedId: payment.id,
    status: 'unread',
  });
  
  // Notify tenant
  addNotification({
    userId: tenantId,
    type: 'payment_overdue',
    title: 'ค่าเช่าถึงกำหนดชำระ',
    message: `ค่าเช่าจำนวน ${payment.amount.toLocaleString('th-TH')} บาท สำหรับ${asset.name} ถึงกำหนดชำระแล้ว กรุณาชำระเงินภายในวันที่ ${new Date(payment.dueDate).toLocaleDateString('th-TH')}`,
    relatedId: payment.id,
    status: 'unread',
  });
};

export const notifyPaymentOverdue = (payment: Payment, contract: Contract, asset: Asset): void => {
  const ownerId = asset.ownerId;
  const tenantId = contract.tenantId;
  const daysOverdue = Math.floor((new Date().getTime() - new Date(payment.dueDate).getTime()) / (1000 * 60 * 60 * 24));
  
  // Notify owner
  addNotification({
    userId: ownerId,
    type: 'payment_overdue',
    title: 'มีค่าเช่าค้างชำระ',
    message: `ค่าเช่าจำนวน ${payment.amount.toLocaleString('th-TH')} บาท สำหรับ${asset.name} ค้างชำระ ${daysOverdue} วันแล้ว`,
    relatedId: payment.id,
    status: 'unread',
  });
  
  // Notify tenant
  addNotification({
    userId: tenantId,
    type: 'payment_overdue',
    title: 'ค่าเช่าค้างชำระ',
    message: `ค่าเช่าจำนวน ${payment.amount.toLocaleString('th-TH')} บาท สำหรับ${asset.name} ค้างชำระ ${daysOverdue} วันแล้ว กรุณาชำระเงินโดยเร็ว`,
    relatedId: payment.id,
    status: 'unread',
  });
};

// Maintenance notification functions
export const notifyMaintenanceRequest = (maintenance: Maintenance, asset: Asset): void => {
  const ownerId = asset.ownerId;
  
  addNotification({
    userId: ownerId,
    type: 'maintenance_request',
    title: 'มีการแจ้งซ่อมใหม่',
    message: `${maintenance.reportedByName || 'ผู้เช่า'} แจ้งซ่อม: ${maintenance.title} สำหรับ${asset.name}`,
    relatedId: maintenance.id,
    status: 'unread',
  });
};

export const notifyMaintenanceStatusUpdate = (maintenance: Maintenance, asset: Asset, oldStatus: string, timeRange?: string, notes?: string): void => {
  const ownerId = asset.ownerId;
  const tenantId = maintenance.reportedBy;
  
  if (!tenantId) return;
  
  const statusText: Record<string, string> = {
    'pending': 'รอดำเนินการ',
    'in_progress': 'กำลังดำเนินการ',
    'completed': 'เสร็จสิ้น',
    'cancelled': 'ยกเลิก',
  };
  
  // Notify tenant when status changes
  if (oldStatus !== maintenance.status) {
    let message = `การแจ้งซ่อม "${maintenance.title}" สำหรับ${asset.name} เปลี่ยนสถานะเป็น "${statusText[maintenance.status] || maintenance.status}"`;
    
    // Add scheduled date if available
    if (maintenance.scheduledDate) {
      const scheduledDate = new Date(maintenance.scheduledDate).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      message += `\nวันที่นัดหมาย: ${scheduledDate}`;
    }
    
    // Add time range if provided
    if (timeRange) {
      message += `\nช่วงเวลา: ${timeRange}`;
    }
    
    // Add notes if provided
    if (notes) {
      message += `\nหมายเหตุ: ${notes}`;
    }
    
    addNotification({
      userId: tenantId,
      type: 'maintenance_request',
      title: maintenance.status === 'in_progress' ? 'รับเรื่องการซ่อม' : 
             maintenance.status === 'completed' ? 'การซ่อมเสร็จสิ้น' : 
             'อัปเดตสถานะการซ่อม',
      message: message,
      relatedId: maintenance.id,
      status: 'unread',
    });
  }
};

// Check and create payment notifications (should be called periodically or when payments are created)
export const checkPaymentNotifications = (): void => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  mockPayments.forEach(payment => {
    if (payment.status === 'pending') {
      const contract = mockContracts.find(c => c.id === payment.contractId);
      if (!contract) return;
      
      const asset = mockAssets.find(a => a.id === contract.assetId);
      if (!asset) return;
      
      const dueDate = new Date(payment.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Check if notification already exists for this payment
      const existingNotification = mockNotifications.find(
        n => n.type === 'payment_overdue' && n.relatedId === payment.id
      );
      
      if (daysDiff === 0 && !existingNotification) {
        // Due today
        notifyPaymentDue(payment, contract, asset);
      } else if (daysDiff > 0 && !existingNotification) {
        // Overdue
        notifyPaymentOverdue(payment, contract, asset);
      }
    }
  });
};

// Maintenance management functions
export const addMaintenance = (maintenance: Omit<Maintenance, 'id' | 'createdAt' | 'updatedAt'>): Maintenance => {
  const asset = mockAssets.find(a => a.id === maintenance.assetId);
  if (!asset) {
    throw new Error('Asset not found');
  }
  
  const newMaintenance: Maintenance = {
    ...maintenance,
    id: `maintenance_${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  mockMaintenance.push(newMaintenance);
  
  // Notify owner
  notifyMaintenanceRequest(newMaintenance, asset);
  
  return newMaintenance;
};

export const updateMaintenance = (id: string, updates: Partial<Maintenance>, timeRange?: string, notes?: string): Maintenance | null => {
  const maintenanceIndex = mockMaintenance.findIndex(m => m.id === id);
  if (maintenanceIndex === -1) return null;
  
  const oldMaintenance = { ...mockMaintenance[maintenanceIndex] };
  const updatedMaintenance: Maintenance = {
    ...mockMaintenance[maintenanceIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  mockMaintenance[maintenanceIndex] = updatedMaintenance;
  
  // Notify if status changed
  if (updates.status && updates.status !== oldMaintenance.status) {
    const asset = mockAssets.find(a => a.id === updatedMaintenance.assetId);
    if (asset) {
      notifyMaintenanceStatusUpdate(updatedMaintenance, asset, oldMaintenance.status, timeRange, notes);
    }
  }
  
  return updatedMaintenance;
};

