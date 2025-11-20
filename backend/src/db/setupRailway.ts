import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

// Railway PostgreSQL connection string
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:BhOWSJgBYIbkoCaMoWcDngqgBdXnQPxm@shortline.proxy.rlwy.net:30344/railway';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function setupDatabase() {
  try {
    console.log('🔧 Starting database setup...');
    console.log('📡 Connecting to Railway database...');

    // Read and execute schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf-8');
    
    console.log('📋 Creating tables...');
    await pool.query(schemaSQL);
    console.log('✅ Tables created successfully!');

    // Create owner user
    console.log('👤 Creating owner user...');
    const phone = '0968819671';
    const email = 'nuttapong.silwuti@gmail.com';
    const password = '123456';
    const name = 'Owner'; // Default name, can be updated later
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE phone = $1',
      [phone]
    );

    if (existingUser.rows.length > 0) {
      console.log('⚠️  User already exists, updating...');
      await pool.query(
        `UPDATE users 
         SET password = $1, email = $2, role = 'owner', name = $3, updated_at = CURRENT_TIMESTAMP
         WHERE phone = $4`,
        [hashedPassword, email, name, phone]
      );
      console.log('✅ User updated successfully!');
    } else {
      await pool.query(
        `INSERT INTO users (phone, password, role, name, email, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [phone, hashedPassword, 'owner', name, email]
      );
      console.log('✅ Owner user created successfully!');
    }

    console.log('\n📊 User Details:');
    console.log('   Phone: 0968819671');
    console.log('   Email: nuttapong.silwuti@gmail.com');
    console.log('   Password: 123456');
    console.log('   Role: owner');
    
    console.log('\n✅ Database setup completed successfully!');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Database setup failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

setupDatabase();

