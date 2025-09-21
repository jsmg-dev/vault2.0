const { Pool } = require('pg');
const config = require('../config');
const pool = new Pool(config.database);

async function fixLaundryServices() {
  try {
    console.log('Fixing laundry_services table...');

    // Add is_active column if it doesn't exist
    await pool.query(`
      ALTER TABLE laundry_services 
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
    `);
    console.log('✅ Added is_active column to laundry_services table');

    // Add other missing columns that might be needed
    await pool.query(`
      ALTER TABLE laundry_services 
      ADD COLUMN IF NOT EXISTS laundry_price DECIMAL(10,2);
    `);
    console.log('✅ Added laundry_price column to laundry_services table');

    await pool.query(`
      ALTER TABLE laundry_services 
      ADD COLUMN IF NOT EXISTS dry_clean_price DECIMAL(10,2);
    `);
    console.log('✅ Added dry_clean_price column to laundry_services table');

    await pool.query(`
      ALTER TABLE laundry_services 
      ADD COLUMN IF NOT EXISTS ironing_price DECIMAL(10,2);
    `);
    console.log('✅ Added ironing_price column to laundry_services table');

    await pool.query(`
      ALTER TABLE laundry_services 
      ADD COLUMN IF NOT EXISTS icon VARCHAR(255);
    `);
    console.log('✅ Added icon column to laundry_services table');

    await pool.query(`
      ALTER TABLE laundry_services 
      ADD COLUMN IF NOT EXISTS cloth_type VARCHAR(255);
    `);
    console.log('✅ Added cloth_type column to laundry_services table');

    await pool.query(`
      ALTER TABLE laundry_services 
      ADD COLUMN IF NOT EXISTS pickup BOOLEAN DEFAULT true;
    `);
    console.log('✅ Added pickup column to laundry_services table');

    await pool.query(`
      ALTER TABLE laundry_services 
      ADD COLUMN IF NOT EXISTS photo TEXT;
    `);
    console.log('✅ Added photo column to laundry_services table');

    // Update existing records to have default values
    await pool.query(`
      UPDATE laundry_services 
      SET 
        is_active = COALESCE(is_active, true),
        laundry_price = COALESCE(laundry_price, price),
        dry_clean_price = COALESCE(dry_clean_price, price * 2),
        ironing_price = COALESCE(ironing_price, price * 0.5),
        icon = COALESCE(icon, 'fas fa-tshirt'),
        cloth_type = COALESCE(cloth_type, 'General'),
        pickup = COALESCE(pickup, true),
        photo = COALESCE(photo, 'https://via.placeholder.com/80x80/4CAF50/ffffff?text=SERVICE')
      WHERE is_active IS NULL OR laundry_price IS NULL OR dry_clean_price IS NULL 
         OR ironing_price IS NULL OR icon IS NULL OR cloth_type IS NULL 
         OR pickup IS NULL OR photo IS NULL;
    `);
    console.log('✅ Updated existing records with default values');

    console.log('Laundry services table fix completed successfully!');
  } catch (error) {
    console.error('Error fixing laundry services table:', error);
  } finally {
    await pool.end();
  }
}

fixLaundryServices();
