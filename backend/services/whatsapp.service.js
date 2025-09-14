// WhatsApp Service for sending premium due notifications
const axios = require('axios');
require('dotenv').config();

class WhatsAppService {
  constructor() {
    // You can use different WhatsApp APIs:
    // 1. Twilio WhatsApp API (recommended for production)
    // 2. WhatsApp Business API
    // 3. WhatsApp Web API (for development/testing)
    
    this.apiUrl = process.env.WHATSAPP_API_URL || 'https://api.whatsapp.com/send';
    this.token = process.env.WHATSAPP_TOKEN || '';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
  }

  // Format phone number to include country code
  formatPhoneNumber(phoneNumber) {
    // Remove any non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // If number doesn't start with country code, add +91 for India
    if (!cleaned.startsWith('91') && cleaned.length === 10) {
      cleaned = '91' + cleaned;
    }
    
    // Add + prefix
    return '+' + cleaned;
  }

  // Send WhatsApp message using Twilio (recommended)
  async sendTwilioMessage(to, message) {
    try {
      const twilio = require('twilio');
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );

      const response = await client.messages.create({
        body: message,
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`, // e.g., whatsapp:+14155238886
        to: `whatsapp:${to}`
      });

      console.log(`✅ WhatsApp message sent successfully: ${response.sid}`);
      return { success: true, messageId: response.sid };
    } catch (error) {
      console.error('❌ Twilio WhatsApp error:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Send WhatsApp message using WhatsApp Business API
  async sendBusinessAPIMessage(to, message) {
    try {
      const response = await axios.post(
        `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: to,
          type: 'text',
          text: {
            body: message
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`✅ WhatsApp Business API message sent: ${response.data.messages[0].id}`);
      return { success: true, messageId: response.data.messages[0].id };
    } catch (error) {
      console.error('❌ WhatsApp Business API error:', error.response?.data || error.message);
      return { success: false, error: error.response?.data || error.message };
    }
  }

  // Send WhatsApp message (fallback to web link)
  async sendWebMessage(to, message) {
    try {
      const formattedPhone = this.formatPhoneNumber(to);
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${formattedPhone.replace('+', '')}?text=${encodedMessage}`;
      
      console.log(`📱 WhatsApp web link generated: ${whatsappUrl}`);
      
      // For development, you might want to open this in browser
      // In production, you'd use a proper WhatsApp API
      return { 
        success: true, 
        messageId: 'web-link',
        url: whatsappUrl,
        note: 'This is a web link for development. Use Twilio or WhatsApp Business API for production.'
      };
    } catch (error) {
      console.error('❌ WhatsApp web link error:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Main method to send WhatsApp message
  async sendMessage(phoneNumber, message) {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      // Try Twilio first (if configured)
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        return await this.sendTwilioMessage(formattedPhone, message);
      }
      
      // Try WhatsApp Business API (if configured)
      if (this.token && this.phoneNumberId) {
        return await this.sendBusinessAPIMessage(formattedPhone, message);
      }
      
      // Fallback to web link
      return await this.sendWebMessage(formattedPhone, message);
      
    } catch (error) {
      console.error('❌ WhatsApp send error:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Generate premium due message
  generatePremiumDueMessage(policy) {
    const today = new Date().toLocaleDateString('en-IN');
    
    return `🏦 *LIC Policy Premium Due Reminder*

Dear ${policy.fullname},

Your LIC policy premium is due today (${today}).

📋 *Policy Details:*
• Policy No: ${policy.policy_no}
• Plan: ${policy.plan_name}
• Premium Amount: ₹${policy.premium}
• Payment Mode: ${policy.mode_of_payment}

⏰ *Due Date:* ${today}
💰 *Amount Due:* ₹${policy.premium}

Please make the payment at your earliest convenience to avoid any late fees or policy lapse.

For any queries, please contact us.

Thank you for choosing our services! 🙏`;
  }
}

module.exports = new WhatsAppService();
