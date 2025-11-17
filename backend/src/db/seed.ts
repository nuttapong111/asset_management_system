import bcrypt from 'bcryptjs';
import pool from './connection';
import { v4 as uuidv4 } from 'uuid';

// Generate fixed UUIDs for consistency with mock data
// These UUIDs will be used consistently across all tables
const USER_IDS = {
  admin: '00000000-0000-0000-0000-000000000001',
  owner: '00000000-0000-0000-0000-000000000002',
  tenant: '00000000-0000-0000-0000-000000000003',
};

const ASSET_IDS = {
  '1': '10000000-0000-0000-0000-000000000001',
  '2': '10000000-0000-0000-0000-000000000002',
  '3': '10000000-0000-0000-0000-000000000003',
  '4': '10000000-0000-0000-0000-000000000004',
  '5': '10000000-0000-0000-0000-000000000005',
  '6': '10000000-0000-0000-0000-000000000006',
  '7': '10000000-0000-0000-0000-000000000007',
  '8': '10000000-0000-0000-0000-000000000008',
  '9': '10000000-0000-0000-0000-000000000009',
  '10': '10000000-0000-0000-0000-00000000000a',
  '11': '10000000-0000-0000-0000-00000000000b',
  '12': '10000000-0000-0000-0000-00000000000c',
  '13': '10000000-0000-0000-0000-00000000000d',
  '14': '10000000-0000-0000-0000-00000000000e',
  '15': '10000000-0000-0000-0000-00000000000f',
  '16': '10000000-0000-0000-0000-000000000010',
  '17': '10000000-0000-0000-0000-000000000011',
};

const CONTRACT_IDS = {
  '1': '20000000-0000-0000-0000-000000000001',
  '2': '20000000-0000-0000-0000-000000000002',
  '3': '20000000-0000-0000-0000-000000000003',
  '4': '20000000-0000-0000-0000-000000000004',
  '5': '20000000-0000-0000-0000-000000000005',
  '6': '20000000-0000-0000-0000-000000000006',
};

const PAYMENT_IDS = {
  '1': '30000000-0000-0000-0000-000000000001',
  '2': '30000000-0000-0000-0000-000000000002',
};

const MAINTENANCE_IDS = {
  '1': '40000000-0000-0000-0000-000000000001',
  '2': '40000000-0000-0000-0000-000000000002',
  '3': '40000000-0000-0000-0000-000000000003',
};

const FINANCIAL_RECORD_IDS = {
  '1': '50000000-0000-0000-0000-000000000001',
  '2': '50000000-0000-0000-0000-000000000002',
};

// Mock data from frontend
const mockUsers = [
  {
    id: USER_IDS.admin,
    phone: '0812345678',
    password: 'admin123',
    role: 'admin',
    name: 'ผู้ดูแลระบบ',
    email: 'admin@example.com',
    address: null,
  },
  {
    id: USER_IDS.owner,
    phone: '0823456789',
    password: 'owner123',
    role: 'owner',
    name: 'สมชาย ใจดี',
    email: 'owner@example.com',
    address: null,
  },
  {
    id: USER_IDS.tenant,
    phone: '0834567890',
    password: 'tenant123',
    role: 'tenant',
    name: 'สมหญิง รักดี',
    email: 'tenant@example.com',
    address: null,
  },
];

const mockAssets = [
  {
    id: ASSET_IDS['1'],
    owner_id: USER_IDS.owner,
    type: 'house',
    name: 'บ้านเดี่ยว 2 ชั้น',
    address: '123 ถนนสุขุมวิท',
    district: 'คลองตัน',
    province: 'กรุงเทพมหานคร',
    postal_code: '10110',
    size: 150,
    rooms: 3,
    purchase_price: 5000000,
    current_value: 6500000,
    status: 'rented',
    images: ['/images/house1.jpg'],
    documents: [],
    latitude: 13.7367,
    longitude: 100.5231,
    description: 'บ้านเดี่ยวสวยงาม 2 ชั้น พร้อมสวน',
    parent_asset_id: null,
    is_parent: false,
    child_assets: [],
    unit_number: null,
    total_units: null,
    development_history: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: ASSET_IDS['2'],
    owner_id: USER_IDS.owner,
    type: 'condo',
    name: 'คอนโดมิเนียมหรู',
    address: '456 ถนนสีลม',
    district: 'สีลม',
    province: 'กรุงเทพมหานคร',
    postal_code: '10500',
    size: 45,
    rooms: 1,
    purchase_price: 3000000,
    current_value: 4200000,
    status: 'available',
    images: ['/images/condo1.jpg'],
    documents: [],
    latitude: 13.7300,
    longitude: 100.5390,
    description: 'คอนโดมิเนียมใจกลางเมือง พร้อมสิ่งอำนวยความสะดวกครบ',
    parent_asset_id: null,
    is_parent: false,
    child_assets: [],
    unit_number: null,
    total_units: null,
    development_history: null,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
  {
    id: ASSET_IDS['3'],
    owner_id: USER_IDS.owner,
    type: 'apartment',
    name: 'อพาร์ทเมนต์',
    address: '789 ถนนพหลโยธิน',
    district: 'จตุจักร',
    province: 'กรุงเทพมหานคร',
    postal_code: '10900',
    size: 35,
    rooms: 1,
    purchase_price: 2000000,
    current_value: 2500000,
    status: 'maintenance',
    images: ['/images/apartment1.jpg'],
    documents: [],
    latitude: 13.8200,
    longitude: 100.5500,
    description: 'อพาร์ทเมนต์สะดวกสบาย ใกล้รถไฟฟ้า',
    parent_asset_id: null,
    is_parent: false,
    child_assets: [],
    unit_number: null,
    total_units: null,
    development_history: null,
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z',
  },
  {
    id: ASSET_IDS['4'],
    owner_id: USER_IDS.owner,
    type: 'house',
    name: 'บ้านเดี่ยว 1 ชั้น',
    address: '321 ถนนรัชดาภิเษก',
    district: 'ห้วยขวาง',
    province: 'กรุงเทพมหานคร',
    postal_code: '10310',
    size: 120,
    rooms: 2,
    purchase_price: 4000000,
    current_value: 5200000,
    status: 'available',
    images: [],
    documents: [],
    latitude: 13.7800,
    longitude: 100.5700,
    description: 'บ้านเดี่ยว 1 ชั้น สะดวกสบาย',
    parent_asset_id: null,
    is_parent: false,
    child_assets: [],
    unit_number: null,
    total_units: null,
    development_history: null,
    created_at: '2024-01-04T00:00:00Z',
    updated_at: '2024-01-04T00:00:00Z',
  },
  {
    id: ASSET_IDS['5'],
    owner_id: USER_IDS.owner,
    type: 'condo',
    name: 'คอนโดมิเนียมกลางเมือง',
    address: '654 ถนนเพชรบุรี',
    district: 'ราชเทวี',
    province: 'กรุงเทพมหานคร',
    postal_code: '10400',
    size: 50,
    rooms: 2,
    purchase_price: 3500000,
    current_value: 4800000,
    status: 'rented',
    images: [],
    documents: [],
    latitude: 13.7500,
    longitude: 100.5400,
    description: 'คอนโดมิเนียมใจกลางเมือง',
    parent_asset_id: null,
    is_parent: false,
    child_assets: [],
    unit_number: null,
    total_units: null,
    development_history: null,
    created_at: '2024-01-05T00:00:00Z',
    updated_at: '2024-01-05T00:00:00Z',
  },
  {
    id: ASSET_IDS['6'],
    owner_id: USER_IDS.owner,
    type: 'apartment',
    name: 'อพาร์ทเมนต์ใกล้ BTS',
    address: '987 ถนนอโศก',
    district: 'วัฒนา',
    province: 'กรุงเทพมหานคร',
    postal_code: '10110',
    size: 40,
    rooms: 1,
    purchase_price: 2500000,
    current_value: 3000000,
    status: 'available',
    images: [],
    documents: [],
    latitude: 13.7400,
    longitude: 100.5600,
    description: 'อพาร์ทเมนต์ใกล้ BTS อโศก',
    parent_asset_id: null,
    is_parent: false,
    child_assets: [],
    unit_number: null,
    total_units: null,
    development_history: null,
    created_at: '2024-01-06T00:00:00Z',
    updated_at: '2024-01-06T00:00:00Z',
  },
  {
    id: ASSET_IDS['7'],
    owner_id: USER_IDS.owner,
    type: 'land',
    name: 'ที่ดินแปลง A - พัฒนาเป็นห้องเช่า',
    address: '999 ถนนรัชดาภิเษก',
    district: 'ห้วยขวาง',
    province: 'กรุงเทพมหานคร',
    postal_code: '10310',
    size: 500,
    rooms: 0,
    purchase_price: 10000000,
    current_value: 15000000,
    status: 'rented',
    images: [],
    documents: [
      'https://example.com/documents/deed_land_A.pdf',
      'https://example.com/documents/tax_land_A.pdf',
      'https://example.com/documents/insurance_land_A.pdf',
    ],
    latitude: 13.7900,
    longitude: 100.5800,
    description: 'ที่ดินเปล่าที่พัฒนาเป็นห้องเช่า 10 ห้อง',
    parent_asset_id: null,
    is_parent: true,
    child_assets: [ASSET_IDS['8'], ASSET_IDS['9'], ASSET_IDS['10'], ASSET_IDS['11'], ASSET_IDS['12'], ASSET_IDS['13'], ASSET_IDS['14'], ASSET_IDS['15'], ASSET_IDS['16'], ASSET_IDS['17']],
    unit_number: null,
    total_units: 10,
    development_history: JSON.stringify([
      { date: '2024-01-01T00:00:00Z', action: 'land_purchased', description: 'ซื้อที่ดินเปล่า' },
      { date: '2024-02-01T00:00:00Z', action: 'construction_started', description: 'เริ่มก่อสร้างห้องเช่า' },
      { date: '2024-05-01T00:00:00Z', action: 'construction_completed', description: 'ก่อสร้างเสร็จสิ้น' },
      { date: '2024-05-15T00:00:00Z', action: 'units_created', description: 'สร้างห้องเช่า 10 ห้อง' },
    ]),
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-05-15T00:00:00Z',
  },
];

// Child assets (rooms 101-110)
const childAssets = [];
for (let i = 8; i <= 17; i++) {
  const roomNum = String(100 + (i - 7)).padStart(3, '0');
  childAssets.push({
    id: ASSET_IDS[String(i) as keyof typeof ASSET_IDS],
    owner_id: USER_IDS.owner,
    type: 'apartment',
    name: `ที่ดินแปลง A - พัฒนาเป็นห้องเช่า - ห้อง ${roomNum}`,
    address: '999 ถนนรัชดาภิเษก',
    district: 'ห้วยขวาง',
    province: 'กรุงเทพมหานคร',
    postal_code: '10310',
    size: 30,
    rooms: 1,
    purchase_price: 0,
    current_value: 1500000,
    status: i <= 12 ? 'rented' : 'available', // 101-105 rented, 106-110 available
    images: [],
    documents: [],
    latitude: 13.7900,
    longitude: 100.5800,
    description: `ห้องเช่า ${roomNum} ในที่ดินแปลง A`,
    parent_asset_id: ASSET_IDS['7'],
    is_parent: false,
    child_assets: [],
    unit_number: roomNum,
    total_units: null,
    development_history: null,
    created_at: '2024-05-15T00:00:00Z',
    updated_at: '2024-05-15T00:00:00Z',
  });
}

const mockContracts = [
  {
    id: CONTRACT_IDS['1'],
    asset_id: ASSET_IDS['1'],
    tenant_id: USER_IDS.tenant,
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    rent_amount: 25000,
    deposit: 50000,
    insurance: 10000,
    status: 'active',
    documents: [],
    notes: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: CONTRACT_IDS['2'],
    asset_id: ASSET_IDS['8'],
    tenant_id: USER_IDS.tenant,
    start_date: '2024-06-01',
    end_date: '2025-05-31',
    rent_amount: 5000,
    deposit: 10000,
    insurance: 5000,
    status: 'active',
    documents: [],
    notes: null,
    created_at: '2024-06-01T00:00:00Z',
    updated_at: '2024-06-01T00:00:00Z',
  },
  {
    id: CONTRACT_IDS['3'],
    asset_id: ASSET_IDS['9'],
    tenant_id: USER_IDS.tenant,
    start_date: '2024-06-01',
    end_date: '2025-05-31',
    rent_amount: 5000,
    deposit: 10000,
    insurance: 5000,
    status: 'active',
    documents: [],
    notes: null,
    created_at: '2024-06-01T00:00:00Z',
    updated_at: '2024-06-01T00:00:00Z',
  },
  {
    id: CONTRACT_IDS['4'],
    asset_id: ASSET_IDS['10'],
    tenant_id: USER_IDS.tenant,
    start_date: '2024-06-01',
    end_date: '2025-05-31',
    rent_amount: 5000,
    deposit: 10000,
    insurance: 5000,
    status: 'active',
    documents: [],
    notes: null,
    created_at: '2024-06-01T00:00:00Z',
    updated_at: '2024-06-01T00:00:00Z',
  },
  {
    id: CONTRACT_IDS['5'],
    asset_id: ASSET_IDS['11'],
    tenant_id: USER_IDS.tenant,
    start_date: '2024-06-01',
    end_date: '2025-05-31',
    rent_amount: 5000,
    deposit: 10000,
    insurance: 5000,
    status: 'active',
    documents: [],
    notes: null,
    created_at: '2024-06-01T00:00:00Z',
    updated_at: '2024-06-01T00:00:00Z',
  },
  {
    id: CONTRACT_IDS['6'],
    asset_id: ASSET_IDS['12'],
    tenant_id: USER_IDS.tenant,
    start_date: '2024-06-01',
    end_date: '2025-05-31',
    rent_amount: 5000,
    deposit: 10000,
    insurance: 5000,
    status: 'active',
    documents: [],
    notes: null,
    created_at: '2024-06-01T00:00:00Z',
    updated_at: '2024-06-01T00:00:00Z',
  },
];

const mockPayments = [
  {
    id: PAYMENT_IDS['1'],
    contract_id: CONTRACT_IDS['1'],
    amount: 25000,
    type: 'rent',
    due_date: '2024-02-05',
    paid_date: '2024-02-03',
    status: 'paid',
    proof_images: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-02-03T00:00:00Z',
  },
  {
    id: PAYMENT_IDS['2'],
    contract_id: CONTRACT_IDS['1'],
    amount: 25000,
    type: 'rent',
    due_date: '2024-03-05',
    paid_date: null,
    status: 'pending',
    proof_images: [],
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-02-01T00:00:00Z',
  },
];

const mockMaintenance = [
  {
    id: MAINTENANCE_IDS['1'],
    asset_id: ASSET_IDS['3'],
    type: 'repair',
    title: 'ซ่อมแซมระบบไฟฟ้า',
    description: 'มีปัญหาไฟฟ้าดับบ่อย ต้องตรวจสอบและซ่อมแซม',
    cost: 8000,
    status: 'in_progress',
    reported_by: USER_IDS.tenant,
    scheduled_date: '2024-01-15',
    completed_date: null,
    images: [],
    created_at: '2024-01-12T00:00:00Z',
    updated_at: '2024-01-12T00:00:00Z',
  },
  {
    id: MAINTENANCE_IDS['2'],
    asset_id: ASSET_IDS['1'],
    type: 'repair',
    title: 'แจ้งซ่อมประตูหน้าต่าง',
    description: 'ประตูหน้าต่างมีเสียงดังเมื่อเปิด-ปิด ต้องการปรับแต่ง',
    cost: 2000,
    status: 'pending',
    reported_by: USER_IDS.tenant,
    scheduled_date: '2024-02-20',
    completed_date: null,
    images: [],
    created_at: '2024-02-10T00:00:00Z',
    updated_at: '2024-02-10T00:00:00Z',
  },
  {
    id: MAINTENANCE_IDS['3'],
    asset_id: ASSET_IDS['5'],
    type: 'repair',
    title: 'แจ้งซ่อมเครื่องปรับอากาศ',
    description: 'เครื่องปรับอากาศไม่เย็น ต้องการตรวจสอบและเติมน้ำยา',
    cost: 3000,
    status: 'pending',
    reported_by: USER_IDS.tenant,
    scheduled_date: '2024-02-25',
    completed_date: null,
    images: [],
    created_at: '2024-02-12T00:00:00Z',
    updated_at: '2024-02-12T00:00:00Z',
  },
];

const mockFinancialRecords = [
  {
    id: FINANCIAL_RECORD_IDS['1'],
    asset_id: ASSET_IDS['1'],
    contract_id: CONTRACT_IDS['1'],
    type: 'income',
    category: 'rent',
    amount: 25000,
    description: 'ค่าเช่าเดือนมกราคม',
    date: '2024-01-05',
    created_at: '2024-01-05T00:00:00Z',
    updated_at: '2024-01-05T00:00:00Z',
  },
  {
    id: FINANCIAL_RECORD_IDS['2'],
    asset_id: ASSET_IDS['1'],
    contract_id: null,
    type: 'expense',
    category: 'repair',
    amount: 5000,
    description: 'ซ่อมแซมประตู',
    date: '2024-01-10',
    created_at: '2024-01-10T00:00:00Z',
    updated_at: '2024-01-10T00:00:00Z',
  },
];

async function seed() {
  try {
    console.log('🌱 Seeding database with mock data...');

    // Clear existing data
    await pool.query('TRUNCATE TABLE notifications, payments, financial_records, maintenance, contracts, assets, users RESTART IDENTITY CASCADE');

    // Insert users
    console.log('📝 Inserting users...');
    for (const user of mockUsers) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await pool.query(
        `INSERT INTO users (id, phone, password, role, name, email, address, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (phone) DO UPDATE SET
           password = EXCLUDED.password,
           role = EXCLUDED.role,
           name = EXCLUDED.name,
           email = EXCLUDED.email,
           address = EXCLUDED.address,
           updated_at = EXCLUDED.updated_at`,
        [
          user.id,
          user.phone,
          hashedPassword,
          user.role,
          user.name,
          user.email,
          user.address ? JSON.stringify(user.address) : null,
          user.created_at || new Date().toISOString(),
          user.updated_at || new Date().toISOString(),
        ]
      );
    }
    console.log(`✅ Inserted ${mockUsers.length} users`);

    // Insert parent assets first
    console.log('🏠 Inserting assets...');
    for (const asset of mockAssets) {
      await pool.query(
        `INSERT INTO assets (
          id, owner_id, type, name, address, district, province, postal_code,
          size, rooms, purchase_price, current_value, status,
          images, documents, latitude, longitude, description,
          parent_asset_id, is_parent, child_assets, unit_number, total_units, development_history,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
        ON CONFLICT (id) DO UPDATE SET
          owner_id = EXCLUDED.owner_id,
          type = EXCLUDED.type,
          name = EXCLUDED.name,
          address = EXCLUDED.address,
          district = EXCLUDED.district,
          province = EXCLUDED.province,
          postal_code = EXCLUDED.postal_code,
          size = EXCLUDED.size,
          rooms = EXCLUDED.rooms,
          purchase_price = EXCLUDED.purchase_price,
          current_value = EXCLUDED.current_value,
          status = EXCLUDED.status,
          images = EXCLUDED.images,
          documents = EXCLUDED.documents,
          latitude = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude,
          description = EXCLUDED.description,
          parent_asset_id = EXCLUDED.parent_asset_id,
          is_parent = EXCLUDED.is_parent,
          child_assets = EXCLUDED.child_assets,
          unit_number = EXCLUDED.unit_number,
          total_units = EXCLUDED.total_units,
          development_history = EXCLUDED.development_history,
          updated_at = EXCLUDED.updated_at`,
        [
          asset.id,
          asset.owner_id,
          asset.type,
          asset.name,
          asset.address,
          asset.district,
          asset.province,
          asset.postal_code,
          asset.size,
          asset.rooms,
          asset.purchase_price,
          asset.current_value,
          asset.status,
          asset.images,
          asset.documents,
          asset.latitude,
          asset.longitude,
          asset.description,
          asset.parent_asset_id,
          asset.is_parent,
          asset.child_assets,
          asset.unit_number,
          asset.total_units,
          asset.development_history,
          asset.created_at,
          asset.updated_at,
        ]
      );
    }

    // Insert child assets
    for (const asset of childAssets) {
      await pool.query(
        `INSERT INTO assets (
          id, owner_id, type, name, address, district, province, postal_code,
          size, rooms, purchase_price, current_value, status,
          images, documents, latitude, longitude, description,
          parent_asset_id, is_parent, child_assets, unit_number, total_units, development_history,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
        ON CONFLICT (id) DO UPDATE SET
          owner_id = EXCLUDED.owner_id,
          type = EXCLUDED.type,
          name = EXCLUDED.name,
          address = EXCLUDED.address,
          district = EXCLUDED.district,
          province = EXCLUDED.province,
          postal_code = EXCLUDED.postal_code,
          size = EXCLUDED.size,
          rooms = EXCLUDED.rooms,
          purchase_price = EXCLUDED.purchase_price,
          current_value = EXCLUDED.current_value,
          status = EXCLUDED.status,
          images = EXCLUDED.images,
          documents = EXCLUDED.documents,
          latitude = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude,
          description = EXCLUDED.description,
          parent_asset_id = EXCLUDED.parent_asset_id,
          is_parent = EXCLUDED.is_parent,
          child_assets = EXCLUDED.child_assets,
          unit_number = EXCLUDED.unit_number,
          total_units = EXCLUDED.total_units,
          development_history = EXCLUDED.development_history,
          updated_at = EXCLUDED.updated_at`,
        [
          asset.id,
          asset.owner_id,
          asset.type,
          asset.name,
          asset.address,
          asset.district,
          asset.province,
          asset.postal_code,
          asset.size,
          asset.rooms,
          asset.purchase_price,
          asset.current_value,
          asset.status,
          asset.images,
          asset.documents,
          asset.latitude,
          asset.longitude,
          asset.description,
          asset.parent_asset_id,
          asset.is_parent,
          asset.child_assets,
          asset.unit_number,
          asset.total_units,
          asset.development_history,
          asset.created_at,
          asset.updated_at,
        ]
      );
    }
    console.log(`✅ Inserted ${mockAssets.length + childAssets.length} assets`);

    // Insert contracts
    console.log('📄 Inserting contracts...');
    for (const contract of mockContracts) {
      await pool.query(
        `INSERT INTO contracts (
          id, asset_id, tenant_id, start_date, end_date,
          rent_amount, deposit, insurance, status, documents, notes,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (id) DO UPDATE SET
          asset_id = EXCLUDED.asset_id,
          tenant_id = EXCLUDED.tenant_id,
          start_date = EXCLUDED.start_date,
          end_date = EXCLUDED.end_date,
          rent_amount = EXCLUDED.rent_amount,
          deposit = EXCLUDED.deposit,
          insurance = EXCLUDED.insurance,
          status = EXCLUDED.status,
          documents = EXCLUDED.documents,
          notes = EXCLUDED.notes,
          updated_at = EXCLUDED.updated_at`,
        [
          contract.id,
          contract.asset_id,
          contract.tenant_id,
          contract.start_date,
          contract.end_date,
          contract.rent_amount,
          contract.deposit,
          contract.insurance,
          contract.status,
          contract.documents,
          contract.notes,
          contract.created_at,
          contract.updated_at,
        ]
      );
    }
    console.log(`✅ Inserted ${mockContracts.length} contracts`);

    // Insert payments
    console.log('💰 Inserting payments...');
    for (const payment of mockPayments) {
      await pool.query(
        `INSERT INTO payments (
          id, contract_id, amount, type, due_date, paid_date, status, proof_images,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO UPDATE SET
          contract_id = EXCLUDED.contract_id,
          amount = EXCLUDED.amount,
          type = EXCLUDED.type,
          due_date = EXCLUDED.due_date,
          paid_date = EXCLUDED.paid_date,
          status = EXCLUDED.status,
          proof_images = EXCLUDED.proof_images,
          updated_at = EXCLUDED.updated_at`,
        [
          payment.id,
          payment.contract_id,
          payment.amount,
          payment.type,
          payment.due_date,
          payment.paid_date,
          payment.status,
          payment.proof_images,
          payment.created_at,
          payment.updated_at,
        ]
      );
    }
    console.log(`✅ Inserted ${mockPayments.length} payments`);

    // Insert financial records
    console.log('📊 Inserting financial records...');
    for (const record of mockFinancialRecords) {
      await pool.query(
        `INSERT INTO financial_records (
          id, asset_id, contract_id, type, category, amount, description, date,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO UPDATE SET
          asset_id = EXCLUDED.asset_id,
          contract_id = EXCLUDED.contract_id,
          type = EXCLUDED.type,
          category = EXCLUDED.category,
          amount = EXCLUDED.amount,
          description = EXCLUDED.description,
          date = EXCLUDED.date,
          updated_at = EXCLUDED.updated_at`,
        [
          record.id,
          record.asset_id,
          record.contract_id,
          record.type,
          record.category,
          record.amount,
          record.description,
          record.date,
          record.created_at,
          record.updated_at,
        ]
      );
    }
    console.log(`✅ Inserted ${mockFinancialRecords.length} financial records`);

    // Insert maintenance
    console.log('🔧 Inserting maintenance records...');
    for (const maintenance of mockMaintenance) {
      await pool.query(
        `INSERT INTO maintenance (
          id, asset_id, type, title, description, cost, status, reported_by,
          scheduled_date, completed_date, images,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (id) DO UPDATE SET
          asset_id = EXCLUDED.asset_id,
          type = EXCLUDED.type,
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          cost = EXCLUDED.cost,
          status = EXCLUDED.status,
          reported_by = EXCLUDED.reported_by,
          scheduled_date = EXCLUDED.scheduled_date,
          completed_date = EXCLUDED.completed_date,
          images = EXCLUDED.images,
          updated_at = EXCLUDED.updated_at`,
        [
          maintenance.id,
          maintenance.asset_id,
          maintenance.type,
          maintenance.title,
          maintenance.description,
          maintenance.cost,
          maintenance.status,
          maintenance.reported_by,
          maintenance.scheduled_date,
          maintenance.completed_date,
          maintenance.images,
          maintenance.created_at,
          maintenance.updated_at,
        ]
      );
    }
    console.log(`✅ Inserted ${mockMaintenance.length} maintenance records`);

    console.log('✅ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
