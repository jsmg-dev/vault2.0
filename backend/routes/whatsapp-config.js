const express = require('express');
const router = express.Router();
const { query, one } = require('../db');

// Get WhatsApp configuration
router.get('/config', async (req, res) => {
  try {
    const config = await one(`
      SELECT * FROM whatsapp_config 
      WHERE id = 1
    `);
    
    if (config) {
      res.json(config);
    } else {
      // Return default configuration
      res.json({
        id: 1,
        enabled: false,
        api_url: '',
        token: '',
        sender_number: '',
        sender_name: 'Laundry Service',
        status_notifications: true,
        delivery_reminders: true,
        created_at: new Date(),
        updated_at: new Date()
      });
    }
  } catch (error) {
    console.error('Error fetching WhatsApp config:', error);
    res.status(500).json({ error: 'Failed to fetch WhatsApp configuration' });
  }
});

// Update WhatsApp configuration
router.put('/config', async (req, res) => {
  try {
    const {
      enabled,
      api_url,
      token,
      sender_number,
      sender_name,
      status_notifications,
      delivery_reminders
    } = req.body;

    // Validate required fields
    if (enabled && (!sender_number || !sender_name)) {
      return res.status(400).json({ 
        error: 'Sender number and name are required when WhatsApp is enabled' 
      });
    }

    const result = await query(`
      INSERT INTO whatsapp_config (
        id, enabled, api_url, token, sender_number, sender_name,
        status_notifications, delivery_reminders, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      ON CONFLICT (id) DO UPDATE SET
        enabled = EXCLUDED.enabled,
        api_url = EXCLUDED.api_url,
        token = EXCLUDED.token,
        sender_number = EXCLUDED.sender_number,
        sender_name = EXCLUDED.sender_name,
        status_notifications = EXCLUDED.status_notifications,
        delivery_reminders = EXCLUDED.delivery_reminders,
        updated_at = NOW()
      RETURNING *
    `, [
      1, enabled, api_url || '', token || '', sender_number || '', 
      sender_name || 'Laundry Service', status_notifications !== false, 
      delivery_reminders !== false
    ]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating WhatsApp config:', error);
    res.status(500).json({ error: 'Failed to update WhatsApp configuration' });
  }
});

// Test WhatsApp configuration
router.post('/test', async (req, res) => {
  try {
    const { phone_number } = req.body;
    
    if (!phone_number) {
      return res.status(400).json({ error: 'Phone number is required for testing' });
    }

    const config = await one(`
      SELECT * FROM whatsapp_config 
      WHERE id = 1 AND enabled = true
    `);

    if (!config) {
      return res.status(400).json({ error: 'WhatsApp is not enabled or configured' });
    }

    const whatsappService = require('../services/whatsappService');
    const testMessage = `Hi! This is a test message from ${config.sender_name}.

Your WhatsApp integration is working correctly! ✅

---
${config.sender_name}
📱 ${config.sender_number}`;

    const result = await whatsappService.sendMessage(phone_number, testMessage);
    
    res.json({ 
      success: true, 
      message: 'Test message sent successfully',
      result 
    });
  } catch (error) {
    console.error('Error testing WhatsApp:', error);
    res.status(500).json({ 
      error: 'Failed to send test message',
      details: error.message 
    });
  }
});

// Get notification history
router.get('/history', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const notifications = await query(`
      SELECT * FROM whatsapp_notifications 
      ORDER BY created_at DESC 
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    const totalCount = await one(`
      SELECT COUNT(*) as count FROM whatsapp_notifications
    `);

    res.json({
      notifications: notifications.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(totalCount.count),
        pages: Math.ceil(totalCount.count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching notification history:', error);
    res.status(500).json({ error: 'Failed to fetch notification history' });
  }
});

module.exports = router;
