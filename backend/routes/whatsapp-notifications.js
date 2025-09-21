const express = require('express');
const router = express.Router();
const whatsappService = require('../services/whatsappNotificationService');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/whatsapp/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// GET all senders
router.get('/senders', async (req, res) => {
  try {
    const senders = await whatsappService.getAllSenders();
    res.json(senders);
  } catch (error) {
    console.error('Error fetching senders:', error);
    res.status(500).json({ error: 'Failed to fetch senders' });
  }
});

// GET default sender
router.get('/senders/default', async (req, res) => {
  try {
    const sender = await whatsappService.getDefaultSender();
    if (!sender) {
      return res.status(404).json({ error: 'No default sender configured' });
    }
    
    // Don't return sensitive credentials
    const { api_credentials, ...safeSender } = sender;
    res.json(safeSender);
  } catch (error) {
    console.error('Error fetching default sender:', error);
    res.status(500).json({ error: 'Failed to fetch default sender' });
  }
});

// POST save sender configuration
router.post('/senders', upload.single('profile_picture'), async (req, res) => {
  try {
    const {
      sender_name,
      business_display_name,
      whatsapp_number,
      api_provider,
      app_id,
      access_token,
      account_sid,
      auth_token,
      api_key,
      source,
      business_name,
      sender_id,
      is_default,
      branch_location
    } = req.body;

    // Validate required fields
    if (!sender_name || !business_display_name || !whatsapp_number || !api_provider) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Prepare API credentials based on provider
    let api_credentials = {};
    
    switch (api_provider) {
      case 'meta':
        if (!app_id || !access_token || !req.body.phone_number_id) {
          return res.status(400).json({ error: 'Meta API requires app_id, access_token, and phone_number_id' });
        }
        api_credentials = {
          app_id,
          access_token,
          phone_number_id: req.body.phone_number_id
        };
        break;
        
      case 'twilio':
        if (!account_sid || !auth_token || !req.body.from_number) {
          return res.status(400).json({ error: 'Twilio API requires account_sid, auth_token, and from_number' });
        }
        api_credentials = {
          account_sid,
          auth_token,
          from_number: req.body.from_number
        };
        break;
        
      case 'gupshup':
        if (!api_key || !source) {
          return res.status(400).json({ error: 'Gupshup API requires api_key and source' });
        }
        api_credentials = {
          api_key,
          source,
          business_name: business_name || business_display_name
        };
        break;
        
      default:
        return res.status(400).json({ error: 'Unsupported API provider' });
    }

    const configData = {
      sender_name,
      business_display_name,
      whatsapp_number,
      api_provider,
      api_credentials,
      sender_id,
      profile_picture_url: req.file ? `/uploads/whatsapp/${req.file.filename}` : null,
      is_default: is_default === 'true',
      branch_location
    };

    const result = await whatsappService.saveSenderConfig(configData);
    
    // Don't return sensitive credentials
    const { api_credentials: _, ...safeResult } = result;
    res.json(safeResult);
  } catch (error) {
    console.error('Error saving sender config:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT update sender configuration
router.put('/senders/:id', upload.single('profile_picture'), async (req, res) => {
  try {
    const senderId = req.params.id;
    const {
      sender_name,
      business_display_name,
      whatsapp_number,
      api_provider,
      app_id,
      access_token,
      account_sid,
      auth_token,
      api_key,
      source,
      business_name,
      sender_id,
      is_default,
      branch_location
    } = req.body;

    // Get existing sender to preserve credentials if not updated
    const existingSender = await whatsappService.getSenderById(senderId);
    if (!existingSender) {
      return res.status(404).json({ error: 'Sender not found' });
    }

    // Prepare API credentials
    let api_credentials = existingSender.api_credentials;
    
    // Only update credentials if new ones are provided
    if (api_provider && api_provider !== existingSender.api_provider) {
      switch (api_provider) {
        case 'meta':
          if (!app_id || !access_token || !req.body.phone_number_id) {
            return res.status(400).json({ error: 'Meta API requires app_id, access_token, and phone_number_id' });
          }
          api_credentials = { app_id, access_token, phone_number_id: req.body.phone_number_id };
          break;
        case 'twilio':
          if (!account_sid || !auth_token || !req.body.from_number) {
            return res.status(400).json({ error: 'Twilio API requires account_sid, auth_token, and from_number' });
          }
          api_credentials = { account_sid, auth_token, from_number: req.body.from_number };
          break;
        case 'gupshup':
          if (!api_key || !source) {
            return res.status(400).json({ error: 'Gupshup API requires api_key and source' });
          }
          api_credentials = { api_key, source, business_name: business_name || business_display_name };
          break;
      }
    }

    const configData = {
      sender_name: sender_name || existingSender.sender_name,
      business_display_name: business_display_name || existingSender.business_display_name,
      whatsapp_number: whatsapp_number || existingSender.whatsapp_number,
      api_provider: api_provider || existingSender.api_provider,
      api_credentials,
      sender_id: sender_id || existingSender.sender_id,
      profile_picture_url: req.file ? `/uploads/whatsapp/${req.file.filename}` : existingSender.profile_picture_url,
      is_default: is_default === 'true',
      branch_location: branch_location || existingSender.branch_location
    };

    const result = await whatsappService.saveSenderConfig(configData);
    
    // Don't return sensitive credentials
    const { api_credentials: _, ...safeResult } = result;
    res.json(safeResult);
  } catch (error) {
    console.error('Error updating sender config:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE sender
router.delete('/senders/:id', async (req, res) => {
  try {
    const senderId = req.params.id;
    await whatsappService.deleteSender(senderId);
    res.json({ message: 'Sender deleted successfully' });
  } catch (error) {
    console.error('Error deleting sender:', error);
    res.status(500).json({ error: 'Failed to delete sender' });
  }
});

// POST test connection
router.post('/test-connection', async (req, res) => {
  try {
    const { sender_id, test_phone_number, test_message } = req.body;
    
    if (!sender_id || !test_phone_number || !test_message) {
      return res.status(400).json({ error: 'sender_id, test_phone_number, and test_message are required' });
    }

    const result = await whatsappService.testConnection(sender_id, test_phone_number, test_message);
    res.json({ success: true, message: 'Test message sent successfully', result });
  } catch (error) {
    console.error('Error testing connection:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET notification history
router.get('/history', async (req, res) => {
  try {
    const {
      customer_name,
      customer_phone,
      status,
      message_type,
      date_from,
      date_to,
      limit = 50
    } = req.query;

    const filters = {
      customer_name,
      customer_phone,
      status,
      message_type,
      date_from: date_from ? new Date(date_from) : null,
      date_to: date_to ? new Date(date_to) : null,
      limit: parseInt(limit)
    };

    const history = await whatsappService.getNotificationHistory(filters);
    res.json(history);
  } catch (error) {
    console.error('Error fetching notification history:', error);
    res.status(500).json({ error: 'Failed to fetch notification history' });
  }
});

// POST resend notification
router.post('/resend/:id', async (req, res) => {
  try {
    const notificationId = req.params.id;
    const result = await whatsappService.resendNotification(notificationId);
    res.json({ success: true, message: 'Notification resent successfully', result });
  } catch (error) {
    console.error('Error resending notification:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET message templates
router.get('/templates', async (req, res) => {
  try {
    const { one, query } = require('../db');
    const templates = await query('SELECT * FROM whatsapp_templates WHERE is_active = true ORDER BY template_type, template_name');
    res.json(templates.rows);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// POST create/update template
router.post('/templates', async (req, res) => {
  try {
    const { one, query } = require('../db');
    const {
      template_name,
      template_content,
      template_type,
      placeholders,
      is_active = true
    } = req.body;

    if (!template_name || !template_content || !template_type) {
      return res.status(400).json({ error: 'template_name, template_content, and template_type are required' });
    }

    const result = await query(`
      INSERT INTO whatsapp_templates (template_name, template_content, template_type, placeholders, is_active)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (template_name, template_type) 
      DO UPDATE SET
        template_content = EXCLUDED.template_content,
        placeholders = EXCLUDED.placeholders,
        is_active = EXCLUDED.is_active,
        updated_at = NOW()
      RETURNING *
    `, [template_name, template_content, template_type, JSON.stringify(placeholders || []), is_active]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error saving template:', error);
    res.status(500).json({ error: 'Failed to save template' });
  }
});

// PUT update template
router.put('/templates/:id', async (req, res) => {
  try {
    const { one, query } = require('../db');
    const templateId = req.params.id;
    const {
      template_name,
      template_content,
      template_type,
      placeholders,
      is_active
    } = req.body;

    const result = await query(`
      UPDATE whatsapp_templates 
      SET 
        template_name = COALESCE($1, template_name),
        template_content = COALESCE($2, template_content),
        template_type = COALESCE($3, template_type),
        placeholders = COALESCE($4, placeholders),
        is_active = COALESCE($5, is_active),
        updated_at = NOW()
      WHERE id = $6
      RETURNING *
    `, [
      template_name,
      template_content,
      template_type,
      placeholders ? JSON.stringify(placeholders) : null,
      is_active,
      templateId
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// DELETE template
router.delete('/templates/:id', async (req, res) => {
  try {
    const { one, query } = require('../db');
    const templateId = req.params.id;
    
    await query('UPDATE whatsapp_templates SET is_active = false WHERE id = $1', [templateId]);
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

// POST send status change notification (for testing)
router.post('/send-status-notification', async (req, res) => {
  try {
    const { customer_id, old_status, new_status, sender_id } = req.body;
    
    if (!customer_id || !new_status) {
      return res.status(400).json({ error: 'customer_id and new_status are required' });
    }

    // Get customer details
    const { one } = require('../db');
    const customer = await one('SELECT * FROM laundry_customers WHERE id = $1', [customer_id]);
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const result = await whatsappService.sendStatusChangeNotification(customer, old_status, new_status, sender_id);
    res.json({ success: true, message: 'Status change notification sent', result });
  } catch (error) {
    console.error('Error sending status change notification:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
