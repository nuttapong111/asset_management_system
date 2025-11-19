import { readFileSync } from 'fs';
import { join } from 'path';
import pool from './connection';
import dotenv from 'dotenv';

dotenv.config();

async function migrateContractNumber() {
  try {
    console.log('🔄 กำลังเพิ่ม column contract_number ในตาราง contracts...');
    const sql = readFileSync(join(__dirname, 'add_contract_number_column.sql'), 'utf-8');
    await pool.query(sql);
    console.log('✅ เพิ่ม column contract_number เรียบร้อย');
    console.log('✅ สร้าง indexes เรียบร้อย');
    console.log('✅ Migration เสร็จสมบูรณ์');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateContractNumber();

