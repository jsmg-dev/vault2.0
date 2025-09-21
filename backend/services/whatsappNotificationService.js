const crypto = require('crypto');
const { one, query } = require('../db');

class WhatsAppNotificationService {
  constructor() {
    this.encryptionKey = process.env.WHATSAPP_ENCRYPTION_KEY || 'dev-encryption-key-change-in-production';
  }

  // Encryption/Decryption for API credentials
  encrypt(text) {
    const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  decrypt(encryptedText) {
    const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  // Get default sender configuration
  async getDefaultSender() {
    try {
      const sender = await one('SELECT * FROM whatsapp_senders WHERE is_default = true AND is_active = true LIMIT 1');
      if (sender && sender.api_credentials) {
        // Decrypt credentials
        const credentials = JSON.parse(this.decrypt(sender.api_credentials));
        return { ...sender, api_credentials: credentials };
      }
      return null;
    } catch (error) {
      console.error('Error getting default sender:', error);
      return null;
    }
  }

  // Get sender by ID
  async getSenderById(senderId) {
    try {
      const sender = await one('SELECT * FROM whatsapp_senders WHERE id = $1 AND is_active = true', [senderId]);
      if (sender && sender.api_credentials) {
        const credentials = JSON.parse(this.decrypt(sender.api_credentials));
        return { ...sender, api_credentials: credentials };
      }
      return null;
    } catch (error) {
      console.error('Error getting sender by ID:', error);
      return null;
    }
  }

  // Save sender configuration
  async saveSenderConfig(configData) {
    try {
      const {
        sender_name,
        business_display_name,
        whatsapp_number,
        api_provider,
        api_credentials,
        sender_id,
        profile_picture_url,
        is_default,
        branch_location
      } = configData;

      // Encrypt API credentials
      const encryptedCredentials = this.encrypt(JSON.stringify(api_credentials));

      // If this is set as default, unset other defaults
      if (is_default) {
        await query('UPDATE whatsapp_senders SET is_default = false');
      }

      const result = await query(`
        INSERT INTO whatsapp_senders (
          sender_name, business_display_name, whatsapp_number, api_provider,
          api_credentials, sender_id, profile_picture_url, is_default, branch_location
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (whatsapp_number, branch_location) 
        DO UPDATE SET
          sender_name = EXCLUDED.sender_name,
          business_display_name = EXCLUDED.business_display_name,
          api_provider = EXCLUDED.api_provider,
          api_credentials = EXCLUDED.api_credentials,
          sender_id = EXCLUDED.sender_id,
          profile_picture_url = EXCLUDED.profile_picture_url,
          is_default = EXCLUDED.is_default,
          updated_at = NOW()
        RETURNING *
      `, [sender_name, business_display_name, whatsapp_number, api_provider, 
          encryptedCredentials, sender_id, profile_picture_url, is_default, branch_location]);

      return result.rows[0];
    } catch (error) {
      console.error('Error saving sender config:', error);
      throw error;
    }
  }

  // Test WhatsApp connection
  async testConnection(senderId, testPhoneNumber, testMessage) {
    try {
      const sender = await this.getSenderById(senderId);
      if (!sender) {
        throw new Error('Sender not found');
      }

      const result = await this.sendMessage(sender, testPhoneNumber, testMessage);
      
      // Log the test message
      await query(`
        INSERT INTO whatsapp_notifications (
          customer_name, customer_phone, message_type, message_content, status, sent_at
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, ['Test User', testPhoneNumber, 'test_message', testMessage, 'sent', new Date()]);

      return result;
    } catch (error) {
      console.error('Error testing connection:', error);
      throw error;
    }
  }

  // Send WhatsApp message using different providers
  async sendMessage(sender, to, message, templateData = null) {
    try {
      const { api_provider, api_credentials } = sender;

      switch (api_provider) {
        case 'meta':
          return await this.sendViaMetaAPI(to, message, api_credentials, templateData);
        case 'twilio':
          return await this.sendViaTwilio(to, message, api_credentials);
        case 'gupshup':
          return await this.sendViaGupshup(to, message, api_credentials);
        default:
          throw new Error(`Unsupported API provider: ${api_provider}`);
      }
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      throw error;
    }
  }

  // Meta Cloud API (WhatsApp Business API)
  async sendViaMetaAPI(to, message, credentials, templateData = null) {
    const { app_id, access_token, phone_number_id } = credentials;
    
    try {
      const url = `https://graph.facebook.com/v18.0/${phone_number_id}/messages`;
      
      const payload = {
        messaging_product: 'whatsapp',
        to: to.replace(/\D/g, ''), // Remove non-digits
        type: 'text',
        text: { body: message }
      };

      // If template data is provided, use template message
      if (templateData) {
        payload.type = 'template';
        payload.template = templateData;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(`Meta API error: ${response.status} - ${JSON.stringify(responseData)}`);
      }

      return {
        success: true,
        messageId: responseData.messages?.[0]?.id,
        provider: 'meta',
        response: responseData
      };
    } catch (error) {
      throw new Error(`Meta API error: ${error.message}`);
    }
  }

  // Twilio WhatsApp API
  async sendViaTwilio(to, message, credentials) {
    const { account_sid, auth_token, from_number } = credentials;
    
    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${account_sid}/Messages.json`;
      
      const payload = new URLSearchParams({
        From: `whatsapp:${from_number}`,
        To: `whatsapp:${to}`,
        Body: message
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${account_sid}:${auth_token}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: payload
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(`Twilio API error: ${response.status} - ${JSON.stringify(responseData)}`);
      }

      return {
        success: true,
        messageId: responseData.sid,
        provider: 'twilio',
        response: responseData
      };
    } catch (error) {
      throw new Error(`Twilio API error: ${error.message}`);
    }
  }

  // Gupshup WhatsApp API
  async sendViaGupshup(to, message, credentials) {
    const { api_key, source, destination } = credentials;
    
    try {
      const url = 'https://api.gupshup.io/wa/api/v1/msg';
      
      const payload = new URLSearchParams({
        channel: 'whatsapp',
        source: source,
        destination: to,
        'src.name': credentials.business_name || 'LaundryService',
        message: {
          type: 'text',
          text: message
        }
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'apikey': api_key,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: payload
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(`Gupshup API error: ${response.status} - ${JSON.stringify(responseData)}`);
      }

      return {
        success: true,
        messageId: responseData.messageId,
        provider: 'gupshup',
        response: responseData
      };
    } catch (error) {
      throw new Error(`Gupshup API error: ${error.message}`);
    }
  }

  // Get message template
  async getTemplate(templateType) {
    try {
      const template = await one(
        'SELECT * FROM whatsapp_templates WHERE template_type = $1 AND is_active = true LIMIT 1',
        [templateType]
      );
      return template;
    } catch (error) {
      console.error('Error getting template:', error);
      return null;
    }
  }

  // Replace template placeholders
  replacePlaceholders(template, data) {
    let message = template.template_content;
    
    // Replace all placeholders with actual data
    Object.keys(data).forEach(key => {
      const placeholder = `{{${key}}}`;
      message = message.replace(new RegExp(placeholder, 'g'), data[key] || '');
    });

    return message;
  }

  // Send status change notification
  async sendStatusChangeNotification(customer, oldStatus, newStatus, senderId = null) {
    try {
      const sender = senderId ? await this.getSenderById(senderId) : await this.getDefaultSender();
      if (!sender) {
        throw new Error('No active WhatsApp sender configured');
      }

      // Get appropriate template based on status
      let templateType = 'status_change';
      if (newStatus === 'received') templateType = 'order_received';
      if (newStatus === 'readyForDelivery') templateType = 'ready_for_delivery';
      if (newStatus === 'delivered') templateType = 'order_delivered';

      const template = await this.getTemplate(templateType);
      if (!template) {
        throw new Error(`Template not found for type: ${templateType}`);
      }

      // Prepare template data
      const templateData = {
        customer_name: customer.name,
        order_id: customer.id,
        old_status: this.formatStatusName(oldStatus),
        new_status: this.formatStatusName(newStatus),
        order_details: customer.items || 'No items listed',
        total_amount: customer.total_amount || 'N/A',
        status_message: this.getStatusMessage(newStatus),
        business_name: sender.business_display_name
      };

      const message = this.replacePlaceholders(template, templateData);

      // Send the message
      const result = await this.sendMessage(sender, customer.phone, message);

      // Log the notification
      await this.logNotification({
        customer_id: customer.id,
        customer_name: customer.name,
        customer_phone: customer.phone,
        order_id: customer.id,
        template_id: template.id,
        sender_id: sender.id,
        message_type: 'status_change',
        old_status: oldStatus,
        new_status: newStatus,
        message_content: message,
        status: 'sent',
        provider_response: result.response,
        sent_at: new Date()
      });

      return result;
    } catch (error) {
      console.error('Error sending status change notification:', error);

      // Log failed notification
      await this.logNotification({
        customer_id: customer.id,
        customer_name: customer.name,
        customer_phone: customer.phone,
        order_id: customer.id,
        sender_id: senderId,
        message_type: 'status_change',
        old_status: oldStatus,
        new_status: newStatus,
        message_content: 'Failed to generate message',
        status: 'failed',
        error_message: error.message
      });

      throw error;
    }
  }

  // Format status name for display
  formatStatusName(status) {
    const statusMap = {
      'received': 'Received',
      'inProcess': 'In Process',
      'readyForDelivery': 'Ready for Delivery',
      'delivered': 'Delivered',
      'billed': 'Billed',
      'cancelled': 'Cancelled'
    };
    return statusMap[status] || status;
  }

  // Get status-specific message
  getStatusMessage(status) {
    const messages = {
      'received': 'We\'ll start processing your order soon!',
      'inProcess': 'Your order is being processed. We\'re working on it!',
      'readyForDelivery': 'Great news! Your order is ready for pickup/delivery.',
      'delivered': 'Your order has been successfully delivered.',
      'billed': 'Your order has been billed. Please complete payment.',
      'cancelled': 'Your order has been cancelled. Please contact us for details.'
    };
    return messages[status] || 'Your order status has been updated.';
  }

  // Log notification
  async logNotification(notificationData) {
    try {
      const {
        customer_id, customer_name, customer_phone, order_id, template_id,
        sender_id, message_type, old_status, new_status, message_content,
        status, error_message, provider_response, sent_at
      } = notificationData;

      await query(`
        INSERT INTO whatsapp_notifications (
          customer_id, customer_name, customer_phone, order_id, template_id,
          sender_id, message_type, old_status, new_status, message_content,
          status, error_message, provider_response, sent_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `, [
        customer_id, customer_name, customer_phone, order_id, template_id,
        sender_id, message_type, old_status, new_status, message_content,
        status, error_message, provider_response ? JSON.stringify(provider_response) : null, sent_at
      ]);
    } catch (error) {
      console.error('Error logging notification:', error);
    }
  }

  // Get notification history
  async getNotificationHistory(filters = {}) {
    try {
      let queryStr = `
        SELECT 
          wn.*,
          ws.sender_name,
          ws.business_display_name,
          wt.template_name
        FROM whatsapp_notifications wn
        LEFT JOIN whatsapp_senders ws ON wn.sender_id = ws.id
        LEFT JOIN whatsapp_templates wt ON wn.template_id = wt.id
        WHERE 1=1
      `;
      
      const params = [];
      let paramIndex = 1;

      if (filters.customer_name) {
        queryStr += ` AND wn.customer_name ILIKE $${paramIndex}`;
        params.push(`%${filters.customer_name}%`);
        paramIndex++;
      }

      if (filters.customer_phone) {
        queryStr += ` AND wn.customer_phone ILIKE $${paramIndex}`;
        params.push(`%${filters.customer_phone}%`);
        paramIndex++;
      }

      if (filters.status) {
        queryStr += ` AND wn.status = $${paramIndex}`;
        params.push(filters.status);
        paramIndex++;
      }

      if (filters.message_type) {
        queryStr += ` AND wn.message_type = $${paramIndex}`;
        params.push(filters.message_type);
        paramIndex++;
      }

      if (filters.date_from) {
        queryStr += ` AND wn.created_at >= $${paramIndex}`;
        params.push(filters.date_from);
        paramIndex++;
      }

      if (filters.date_to) {
        queryStr += ` AND wn.created_at <= $${paramIndex}`;
        params.push(filters.date_to);
        paramIndex++;
      }

      queryStr += ` ORDER BY wn.created_at DESC`;

      if (filters.limit) {
        queryStr += ` LIMIT $${paramIndex}`;
        params.push(filters.limit);
      }

      const result = await query(queryStr, params);
      return result.rows;
    } catch (error) {
      console.error('Error getting notification history:', error);
      throw error;
    }
  }

  // Resend failed notification
  async resendNotification(notificationId) {
    try {
      const notification = await one(
        'SELECT * FROM whatsapp_notifications WHERE id = $1',
        [notificationId]
      );

      if (!notification) {
        throw new Error('Notification not found');
      }

      if (notification.status === 'sent') {
        throw new Error('Notification already sent');
      }

      const sender = await this.getSenderById(notification.sender_id);
      if (!sender) {
        throw new Error('Sender not found');
      }

      const result = await this.sendMessage(sender, notification.customer_phone, notification.message_content);

      // Update notification status
      await query(
        'UPDATE whatsapp_notifications SET status = $1, sent_at = $2, provider_response = $3 WHERE id = $4',
        ['sent', new Date(), JSON.stringify(result.response), notificationId]
      );

      return result;
    } catch (error) {
      // Update notification with error
      await query(
        'UPDATE whatsapp_notifications SET status = $1, error_message = $2 WHERE id = $3',
        ['failed', error.message, notificationId]
      );
      
      throw error;
    }
  }

  // Get all senders
  async getAllSenders() {
    try {
      const result = await query(`
        SELECT 
          id, sender_name, business_display_name, whatsapp_number, 
          api_provider, sender_id, profile_picture_url, is_active, 
          is_default, branch_location, created_at, updated_at
        FROM whatsapp_senders 
        WHERE is_active = true 
        ORDER BY is_default DESC, created_at ASC
      `);
      return result.rows;
    } catch (error) {
      console.error('Error getting all senders:', error);
      throw error;
    }
  }

  // Delete sender
  async deleteSender(senderId) {
    try {
      await query('UPDATE whatsapp_senders SET is_active = false WHERE id = $1', [senderId]);
      return true;
    } catch (error) {
      console.error('Error deleting sender:', error);
      throw error;
    }
  }
}

module.exports = new WhatsAppNotificationService();
