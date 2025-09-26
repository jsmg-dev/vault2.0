const express = require('express');
const router = express.Router();
const db = require('../db');

// Get billing configuration
router.get('/', async (req, res) => {
  try {
    const config = await db.query('SELECT * FROM billing_config ORDER BY created_at DESC LIMIT 1');
    
    if (config.rows.length === 0) {
      return res.status(404).json({ error: 'Billing configuration not found' });
    }

    res.json(config.rows[0]);
  } catch (error) {
    console.error('Error fetching billing configuration:', error);
    res.status(500).json({ error: 'Failed to fetch billing configuration' });
  }
});

// Update billing configuration
router.put('/', async (req, res) => {
  try {
    const {
      company_name,
      company_address,
      company_phone,
      company_email,
      company_website,
      company_logo,
      tax_id,
      currency,
      currency_symbol,
      tax_rate,
      invoice_prefix,
      invoice_suffix,
      invoice_number_format,
      due_days,
      late_fee_rate,
      payment_terms,
      footer_text,
      show_tax_breakdown,
      show_payment_terms,
      show_company_logo,
      invoice_template,
      email_template,
      sms_template,
      whatsapp_template,
      auto_send_email,
      auto_send_sms,
      auto_send_whatsapp,
      updated_by
    } = req.body;

    // Check if configuration exists
    const existingConfig = await db.query('SELECT id FROM billing_config ORDER BY created_at DESC LIMIT 1');
    
    let result;
    if (existingConfig.rows.length === 0) {
      // Create new configuration
      result = await db.query(`
        INSERT INTO billing_config (
          company_name, company_address, company_phone, company_email, company_website,
          company_logo, tax_id, currency, currency_symbol, tax_rate, invoice_prefix,
          invoice_suffix, invoice_number_format, due_days, late_fee_rate, payment_terms,
          footer_text, show_tax_breakdown, show_payment_terms, show_company_logo,
          invoice_template, email_template, sms_template, whatsapp_template,
          auto_send_email, auto_send_sms, auto_send_whatsapp, created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29)
        RETURNING *
      `, [
        company_name, company_address, company_phone, company_email, company_website,
        company_logo, tax_id, currency, currency_symbol, tax_rate, invoice_prefix,
        invoice_suffix, invoice_number_format, due_days, late_fee_rate, payment_terms,
        footer_text, show_tax_breakdown, show_payment_terms, show_company_logo,
        invoice_template, email_template, sms_template, whatsapp_template,
        auto_send_email, auto_send_sms, auto_send_whatsapp, updated_by, updated_by
      ]);
    } else {
      // Update existing configuration
      result = await db.query(`
        UPDATE billing_config SET
          company_name = $1, company_address = $2, company_phone = $3, company_email = $4,
          company_website = $5, company_logo = $6, tax_id = $7, currency = $8, currency_symbol = $9,
          tax_rate = $10, invoice_prefix = $11, invoice_suffix = $12, invoice_number_format = $13,
          due_days = $14, late_fee_rate = $15, payment_terms = $16, footer_text = $17,
          show_tax_breakdown = $18, show_payment_terms = $19, show_company_logo = $20,
          invoice_template = $21, email_template = $22, sms_template = $23, whatsapp_template = $24,
          auto_send_email = $25, auto_send_sms = $26, auto_send_whatsapp = $27,
          updated_by = $28, updated_at = NOW()
        WHERE id = $29
        RETURNING *
      `, [
        company_name, company_address, company_phone, company_email, company_website,
        company_logo, tax_id, currency, currency_symbol, tax_rate, invoice_prefix,
        invoice_suffix, invoice_number_format, due_days, late_fee_rate, payment_terms,
        footer_text, show_tax_breakdown, show_payment_terms, show_company_logo,
        invoice_template, email_template, sms_template, whatsapp_template,
        auto_send_email, auto_send_sms, auto_send_whatsapp, updated_by, existingConfig.rows[0].id
      ]);
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating billing configuration:', error);
    res.status(500).json({ error: 'Failed to update billing configuration' });
  }
});

// Get billing templates
router.get('/templates', async (req, res) => {
  try {
    const { type } = req.query;
    
    let query = 'SELECT * FROM billing_templates WHERE is_active = true';
    const params = [];
    
    if (type) {
      query += ' AND template_type = $1';
      params.push(type);
    }
    
    query += ' ORDER BY is_default DESC, template_name ASC';
    
    const templates = await db.query(query, params);
    res.json(templates.rows);
  } catch (error) {
    console.error('Error fetching billing templates:', error);
    res.status(500).json({ error: 'Failed to fetch billing templates' });
  }
});

// Create billing template
router.post('/templates', async (req, res) => {
  try {
    const {
      template_name,
      template_type,
      subject,
      content,
      variables,
      is_default,
      created_by
    } = req.body;

    if (!template_name || !template_type || !content) {
      return res.status(400).json({ error: 'Template name, type, and content are required' });
    }

    // If this is set as default, unset other defaults of the same type
    if (is_default) {
      await db.query(
        'UPDATE billing_templates SET is_default = false WHERE template_type = $1',
        [template_type]
      );
    }

    const result = await db.query(`
      INSERT INTO billing_templates (
        template_name, template_type, subject, content, variables, is_default, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [template_name, template_type, subject, content, JSON.stringify(variables), is_default, created_by]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating billing template:', error);
    res.status(500).json({ error: 'Failed to create billing template' });
  }
});

// Update billing template
router.put('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      template_name,
      template_type,
      subject,
      content,
      variables,
      is_default,
      is_active
    } = req.body;

    // If this is set as default, unset other defaults of the same type
    if (is_default) {
      await db.query(
        'UPDATE billing_templates SET is_default = false WHERE template_type = $1 AND id != $2',
        [template_type, id]
      );
    }

    const result = await db.query(`
      UPDATE billing_templates SET
        template_name = $1, template_type = $2, subject = $3, content = $4,
        variables = $5, is_default = $6, is_active = $7, updated_at = NOW()
      WHERE id = $8
      RETURNING *
    `, [template_name, template_type, subject, content, JSON.stringify(variables), is_default, is_active, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating billing template:', error);
    res.status(500).json({ error: 'Failed to update billing template' });
  }
});

// Delete billing template
router.delete('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query('DELETE FROM billing_templates WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting billing template:', error);
    res.status(500).json({ error: 'Failed to delete billing template' });
  }
});

// Generate invoice preview
router.post('/preview', async (req, res) => {
  try {
    const {
      customer_name = 'Sample Customer',
      customer_phone = '+91-9876543210',
      customer_address = 'Sample Address',
      items = [
        { name: 'Sample Item 1', quantity: 2, price: 100, total: 200 },
        { name: 'Sample Item 2', quantity: 1, price: 150, total: 150 }
      ],
      subtotal = 350,
      tax_rate = 18,
      tax_amount = 63,
      total_amount = 413
    } = req.body;

    // Get current configuration
    const config = await db.query('SELECT * FROM billing_config ORDER BY created_at DESC LIMIT 1');
    const billingConfig = config.rows[0] || {};

    // Generate preview data
    const preview = {
      config: billingConfig,
      invoice: {
        invoice_number: 'INV-2024-01-0001',
        date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + (billingConfig.due_days || 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        customer: {
          name: customer_name,
          phone: customer_phone,
          address: customer_address
        },
        items: items,
        subtotal: subtotal,
        tax_rate: tax_rate,
        tax_amount: tax_amount,
        total_amount: total_amount
      }
    };

    res.json(preview);
  } catch (error) {
    console.error('Error generating invoice preview:', error);
    res.status(500).json({ error: 'Failed to generate invoice preview' });
  }
});

module.exports = router;
