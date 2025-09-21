const { Pool } = require('pg');
const config = require('../config');
const pool = new Pool(config.database);

async function migrateWhatsAppNotificationSystem() {
  try {
    console.log('Creating WhatsApp Notification System tables...');

    // WhatsApp Sender Configuration Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS whatsapp_senders (
        id SERIAL PRIMARY KEY,
        sender_name VARCHAR(255) NOT NULL,
        business_display_name VARCHAR(255) NOT NULL,
        whatsapp_number VARCHAR(50) NOT NULL,
        api_provider VARCHAR(50) NOT NULL, -- 'meta', 'twilio', 'gupshup', 'other'
        api_credentials JSONB NOT NULL, -- encrypted credentials
        sender_id VARCHAR(100), -- optional sender ID
        profile_picture_url TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        is_default BOOLEAN DEFAULT FALSE,
        branch_location VARCHAR(255), -- for multi-location support
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(whatsapp_number, branch_location)
      );
    `);
    console.log('✅ Created whatsapp_senders table');

    // WhatsApp Message Templates Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS whatsapp_templates (
        id SERIAL PRIMARY KEY,
        template_name VARCHAR(255) NOT NULL,
        template_content TEXT NOT NULL,
        template_type VARCHAR(50) NOT NULL, -- 'status_change', 'delivery_reminder', 'payment_reminder', 'custom'
        placeholders JSONB, -- available placeholders
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Created whatsapp_templates table');

    // WhatsApp Notifications Log Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS whatsapp_notifications (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES laundry_customers(id),
        customer_name VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(50) NOT NULL,
        order_id VARCHAR(100),
        template_id INTEGER REFERENCES whatsapp_templates(id),
        sender_id INTEGER REFERENCES whatsapp_senders(id),
        message_type VARCHAR(50) NOT NULL, -- 'status_change', 'delivery_reminder', 'payment_reminder', 'test_message'
        old_status VARCHAR(50),
        new_status VARCHAR(50),
        message_content TEXT NOT NULL,
        status VARCHAR(50) NOT NULL, -- 'sent', 'failed', 'pending'
        error_message TEXT,
        retry_count INTEGER DEFAULT 0,
        max_retries INTEGER DEFAULT 3,
        provider_response JSONB, -- response from WhatsApp API
        sent_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Created whatsapp_notifications table');

    // Notification Queue Table (for retry mechanism)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS whatsapp_notification_queue (
        id SERIAL PRIMARY KEY,
        notification_id INTEGER REFERENCES whatsapp_notifications(id),
        customer_phone VARCHAR(50) NOT NULL,
        message_content TEXT NOT NULL,
        sender_id INTEGER REFERENCES whatsapp_senders(id),
        priority INTEGER DEFAULT 1, -- 1=high, 2=medium, 3=low
        scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        attempts INTEGER DEFAULT 0,
        max_attempts INTEGER DEFAULT 3,
        status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Created whatsapp_notification_queue table');

    // Create indexes for better performance
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_customer_id ON whatsapp_notifications(customer_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_customer_phone ON whatsapp_notifications(customer_phone);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_status ON whatsapp_notifications(status);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_created_at ON whatsapp_notifications(created_at);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_whatsapp_queue_status ON whatsapp_notification_queue(status);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_whatsapp_queue_scheduled_at ON whatsapp_notification_queue(scheduled_at);`);
    console.log('✅ Created indexes for WhatsApp tables');

    // Insert default message templates
    await pool.query(`
      INSERT INTO whatsapp_templates (template_name, template_content, template_type, placeholders, is_active)
      VALUES 
      (
        'Order Status Update',
        'Hello {{customer_name}}! 👋\n\n🔄 Your laundry order #{{order_id}} status has been updated:\n• From: {{old_status}}\n• To: {{new_status}}\n\n📋 Order Details:\n{{order_details}}\n\n💰 Total Amount: ₹{{total_amount}}\n\n{{status_message}}\n\nThank you for choosing our laundry service! 🧺',
        'status_change',
        '["customer_name", "order_id", "old_status", "new_status", "order_details", "total_amount", "status_message"]',
        true
      ),
      (
        'Order Received',
        'Hello {{customer_name}}! 👋\n\n✅ Your laundry order #{{order_id}} has been received and we''ll start processing it soon!\n\n📋 Order Details:\n{{order_details}}\n\n💰 Total Amount: ₹{{total_amount}}\n\nWe''ll keep you updated on the progress. Thank you for choosing us! 🧺',
        'status_change',
        '["customer_name", "order_id", "order_details", "total_amount"]',
        true
      ),
      (
        'Ready for Delivery',
        'Hello {{customer_name}}! 👋\n\n🎉 Great news! Your laundry order #{{order_id}} is ready for delivery!\n\n📋 Order Details:\n{{order_details}}\n\n💰 Total Amount: ₹{{total_amount}}\n\nWe''ll be in touch to arrange delivery. Thank you! 🧺',
        'status_change',
        '["customer_name", "order_id", "order_details", "total_amount"]',
        true
      ),
      (
        'Order Delivered',
        'Hello {{customer_name}}! 👋\n\n🚚 Your laundry order #{{order_id}} has been successfully delivered!\n\n📋 Order Details:\n{{order_details}}\n\n💰 Total Amount: ₹{{total_amount}}\n\nThank you for choosing our laundry service! We hope you''re satisfied with our service. 🧺',
        'status_change',
        '["customer_name", "order_id", "order_details", "total_amount"]',
        true
      ),
      (
        'Test Message',
        'Hello {{customer_name}}! This is a test message from {{business_name}} to verify WhatsApp integration. 🧺',
        'test_message',
        '["customer_name", "business_name"]',
        true
      )
      ON CONFLICT DO NOTHING;
    `);
    console.log('✅ Inserted default message templates');

    console.log('WhatsApp Notification System migration completed successfully!');
  } catch (error) {
    console.error('Error migrating WhatsApp Notification System:', error);
  } finally {
    await pool.end();
  }
}

migrateWhatsAppNotificationSystem();
