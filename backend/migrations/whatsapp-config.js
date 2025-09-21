const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'vault_db',
  password: 'postgres',
  port: 5432,
});

async function migrateWhatsAppConfig() {
  const client = await pool.connect();
  
  try {
    console.log('Creating WhatsApp configuration tables...');

    // Create whatsapp_config table
    await client.query(`
      CREATE TABLE IF NOT EXISTS whatsapp_config (
        id INTEGER PRIMARY KEY DEFAULT 1,
        enabled BOOLEAN DEFAULT false,
        api_url VARCHAR(500),
        token VARCHAR(500),
        sender_number VARCHAR(20),
        sender_name VARCHAR(100) DEFAULT 'Laundry Service',
        status_notifications BOOLEAN DEFAULT true,
        delivery_reminders BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT single_config CHECK (id = 1)
      );
    `);
    console.log('✅ Created whatsapp_config table');

    // Create whatsapp_notifications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS whatsapp_notifications (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES laundry_customers(id),
        customer_name VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(20) NOT NULL,
        message_type VARCHAR(50) NOT NULL,
        old_status VARCHAR(50),
        new_status VARCHAR(50),
        message_content TEXT NOT NULL,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(20) DEFAULT 'sent',
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Created whatsapp_notifications table');

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_customer 
      ON whatsapp_notifications(customer_id);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_sent_at 
      ON whatsapp_notifications(sent_at);
    `);
    
    console.log('✅ Created indexes for WhatsApp notifications');

    console.log('WhatsApp configuration migration completed successfully!');

  } catch (error) {
    console.error('Error during WhatsApp config migration:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run migration
migrateWhatsAppConfig()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
