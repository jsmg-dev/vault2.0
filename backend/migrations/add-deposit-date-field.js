// Migration to add deposit_date field to lic_policy_details table
const db = require('../db');

async function addDepositDateField() {
  try {
    console.log('Adding deposit_date field to lic_policy_details table...');
    
    // Check if the column already exists
    const checkColumn = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'lic_policy_details' 
      AND column_name = 'deposit_date'
    `);
    
    if (checkColumn.rows.length === 0) {
      // Add the deposit_date column
      await db.query(`
        ALTER TABLE lic_policy_details 
        ADD COLUMN deposit_date DATE
      `);
      
      console.log('✅ deposit_date field added successfully');
    } else {
      console.log('✅ deposit_date field already exists');
    }
    
  } catch (error) {
    console.error('❌ Error adding deposit_date field:', error.message);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  addDepositDateField()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = addDepositDateField;
