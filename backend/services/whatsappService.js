const axios = require('axios');

class WhatsAppService {
  constructor() {
    this.apiUrl = process.env.WHATSAPP_API_URL || 'https://api.whatsapp.com/send';
    this.token = process.env.WHATSAPP_TOKEN || '';
    this.senderNumber = process.env.WHATSAPP_SENDER_NUMBER || '';
    this.senderName = process.env.WHATSAPP_SENDER_NAME || 'Laundry Service';
  }

  // Send WhatsApp message
  async sendMessage(phoneNumber, message) {
    try {
      // Clean phone number (remove spaces, dashes, etc.)
      const cleanPhone = phoneNumber.replace(/[^\d]/g, '');
      
      // Add country code if not present (assuming India +91)
      const formattedPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
      
      // For now, we'll use WhatsApp Web API or a third-party service
      // This is a placeholder implementation - you'll need to integrate with actual WhatsApp Business API
      
      console.log(`WhatsApp Message to ${formattedPhone}: ${message}`);
      
      // If you have WhatsApp Business API credentials, use this:
      /*
      const response = await axios.post(`${this.apiUrl}/messages`, {
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "text",
        text: {
          body: message
        }
      }, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
      */
      
      // For now, return success (implement actual API integration)
      return { success: true, messageId: Date.now().toString() };
      
    } catch (error) {
      console.error('WhatsApp send error:', error);
      throw new Error('Failed to send WhatsApp message');
    }
  }

  // Generate status change message
  generateStatusMessage(customerName, oldStatus, newStatus, orderDetails) {
    const statusMessages = {
      'received': 'Your laundry order has been received and is being processed.',
      'inProcess': 'Your laundry order is now being processed.',
      'readyForDelivery': 'Your laundry order is ready for delivery!',
      'delivered': 'Your laundry order has been delivered successfully.',
      'billed': 'Your laundry order has been completed and billed.',
      'cancelled': 'Your laundry order has been cancelled.'
    };

    const statusNames = {
      'received': 'Received',
      'inProcess': 'In Process',
      'readyForDelivery': 'Ready for Delivery',
      'delivered': 'Delivered',
      'billed': 'Billed',
      'cancelled': 'Cancelled'
    };

    const message = `Hi ${customerName}! 👋

🔄 *Order Status Update*

Your laundry order status has been updated:
• From: ${statusNames[oldStatus] || oldStatus}
• To: ${statusNames[newStatus] || newStatus}

📋 *Order Details:*
${orderDetails.items || 'Items will be updated'}

💰 *Total Amount: ₹${orderDetails.totalAmount || 0}*

${statusMessages[newStatus] || 'Your order status has been updated.'}

Thank you for choosing our laundry service! 🧺

---
${this.senderName}
📱 ${this.senderNumber}`;

    return message;
  }

  // Send status change notification
  async sendStatusChangeNotification(customer, oldStatus, newStatus) {
    try {
      const message = this.generateStatusMessage(
        customer.name,
        oldStatus,
        newStatus,
        {
          items: customer.items || '',
          totalAmount: customer.totalAmount || 0
        }
      );

      return await this.sendMessage(customer.phone, message);
    } catch (error) {
      console.error('Failed to send status change notification:', error);
      throw error;
    }
  }

  // Send delivery reminder
  async sendDeliveryReminder(customer) {
    try {
      const message = `Hi ${customer.name}! 👋

🚚 *Delivery Reminder*

Your laundry order is ready for delivery!

📋 *Order Details:*
${customer.items || 'Items will be updated'}

💰 *Total Amount: ₹${customer.totalAmount || 0}*

Please be available for delivery or contact us to schedule a convenient time.

Thank you for choosing our laundry service! 🧺

---
${this.senderName}
📱 ${this.senderNumber}`;

      return await this.sendMessage(customer.phone, message);
    } catch (error) {
      console.error('Failed to send delivery reminder:', error);
      throw error;
    }
  }
}

module.exports = new WhatsAppService();
