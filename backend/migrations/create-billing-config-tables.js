const db = require('../db');

async function createBillingConfigTables() {
  try {
    console.log('Creating billing configuration tables...');

    // Create billing_config table
    await db.query(`
      CREATE TABLE IF NOT EXISTS billing_config (
        id SERIAL PRIMARY KEY,
        company_name TEXT NOT NULL DEFAULT 'Your Company',
        company_address TEXT,
        company_phone TEXT,
        company_email TEXT,
        company_website TEXT,
        company_logo TEXT,
        tax_id TEXT,
        currency TEXT DEFAULT 'INR',
        currency_symbol TEXT DEFAULT '₹',
        tax_rate DECIMAL(5,2) DEFAULT 18.00,
        invoice_prefix TEXT DEFAULT 'INV',
        invoice_suffix TEXT DEFAULT '',
        invoice_number_format TEXT DEFAULT 'INV-{YYYY}-{MM}-{####}',
        due_days INTEGER DEFAULT 30,
        late_fee_rate DECIMAL(5,2) DEFAULT 0.00,
        payment_terms TEXT DEFAULT 'Payment due within 30 days',
        footer_text TEXT,
        show_tax_breakdown BOOLEAN DEFAULT true,
        show_payment_terms BOOLEAN DEFAULT true,
        show_company_logo BOOLEAN DEFAULT true,
        invoice_template TEXT DEFAULT 'standard',
        email_template TEXT,
        sms_template TEXT,
        whatsapp_template TEXT,
        auto_send_email BOOLEAN DEFAULT false,
        auto_send_sms BOOLEAN DEFAULT false,
        auto_send_whatsapp BOOLEAN DEFAULT false,
        created_by TEXT,
        updated_by TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ billing_config table created');

    // Create billing_templates table
    await db.query(`
      CREATE TABLE IF NOT EXISTS billing_templates (
        id SERIAL PRIMARY KEY,
        template_name TEXT NOT NULL,
        template_type TEXT NOT NULL, -- 'invoice', 'email', 'sms', 'whatsapp'
        subject TEXT,
        content TEXT NOT NULL,
        variables JSONB, -- Available template variables
        is_default BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_by TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ billing_templates table created');

    // Insert default billing configuration
    const configExists = await db.query('SELECT COUNT(*)::int AS cnt FROM billing_config');
    if (configExists.rows[0]?.cnt === 0) {
      await db.query(`
        INSERT INTO billing_config (
          company_name, company_address, company_phone, company_email,
          currency, currency_symbol, tax_rate, invoice_prefix,
          due_days, payment_terms, created_by
        ) VALUES (
          'Your Company Name',
          'Your Company Address',
          '+91-XXXXXXXXXX',
          'contact@yourcompany.com',
          'INR',
          '₹',
          18.00,
          'INV',
          30,
          'Payment due within 30 days',
          'system'
        )
      `);
      console.log('✅ Default billing configuration inserted');
    }

    // Insert default templates
    const templatesExist = await db.query('SELECT COUNT(*)::int AS cnt FROM billing_templates');
    if (templatesExist.rows[0]?.cnt === 0) {
      await db.query(`
        INSERT INTO billing_templates (template_name, template_type, subject, content, variables, is_default, created_by) VALUES
        ('Standard Invoice', 'invoice', '', 'Standard invoice template', '["company_name", "customer_name", "invoice_number", "date", "items", "total"]', true, 'system'),
        ('Payment Reminder Email', 'email', 'Payment Reminder - Invoice {invoice_number}', 'Dear {customer_name},\n\nThis is a friendly reminder that your invoice {invoice_number} for {total_amount} is due on {due_date}.\n\nPlease make payment at your earliest convenience.\n\nThank you,\n{company_name}', '["customer_name", "invoice_number", "total_amount", "due_date", "company_name"]', true, 'system'),
        ('Payment Reminder SMS', 'sms', '', 'Hi {customer_name}, your invoice {invoice_number} of {total_amount} is due on {due_date}. Please pay soon. - {company_name}', '["customer_name", "invoice_number", "total_amount", "due_date", "company_name"]', true, 'system'),
        ('Payment Reminder WhatsApp', 'whatsapp', '', 'Hi {customer_name}!\n\nYour invoice {invoice_number} for {total_amount} is due on {due_date}.\n\nPlease make payment at your earliest convenience.\n\nThank you,\n{company_name}', '["customer_name", "invoice_number", "total_amount", "due_date", "company_name"]', true, 'system')
      `);
      console.log('✅ Default billing templates inserted');
    }

    // Create indexes
    await db.query(`CREATE INDEX IF NOT EXISTS idx_billing_config_created_at ON billing_config(created_at)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_billing_templates_type ON billing_templates(template_type)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_billing_templates_active ON billing_templates(is_active)`);
    
    console.log('✅ All billing configuration indexes created');
    console.log('🎉 Billing configuration tables migration completed successfully!');

  } catch (error) {
    console.error('❌ Error creating billing configuration tables:', error.message);
    throw error;
  }
}

createBillingConfigTables().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
