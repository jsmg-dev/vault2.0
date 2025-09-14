# WhatsApp Integration Setup

## Overview
The LIC Dashboard now includes WhatsApp notifications for premium due policies. The system automatically checks for policies with premium due today and sends WhatsApp messages to customers.

## Features
- **Automatic Daily Notifications**: Runs daily at 9:00 AM IST
- **Manual Notifications**: Send notifications on demand
- **Premium Due Today**: View and manage policies due today
- **WhatsApp Integration**: Multiple API support (Twilio, WhatsApp Business API, Web links)

## API Endpoints

### 1. Check Premium Due Today
```
GET /api/policies/premium-due-today
```
Returns policies with premium due today.

### 2. Send All Due Notifications
```
POST /api/whatsapp/send-premium-due-notifications
```
Sends WhatsApp notifications to all policies due today.

### 3. Send Notification to Specific Policy
```
POST /api/whatsapp/send-to-policy/:policyId
```
Sends WhatsApp notification to a specific policy.

## WhatsApp API Configuration

### Option 1: Twilio WhatsApp (Recommended for Production)
Add to your `.env` file:
```env
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_NUMBER=+14155238886
```

### Option 2: WhatsApp Business API
Add to your `.env` file:
```env
WHATSAPP_TOKEN=your_whatsapp_business_api_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
```

### Option 3: Development Mode (Web Links)
No configuration needed. The system will generate WhatsApp web links for testing.

## Message Template
```
🏦 *LIC Policy Premium Due Reminder*

Dear [Customer Name],

Your LIC policy premium is due today ([Date]).

📋 *Policy Details:*
• Policy No: [Policy Number]
• Plan: [Plan Name]
• Premium Amount: ₹[Amount]
• Payment Mode: [Mode]

⏰ *Due Date:* [Today's Date]
💰 *Amount Due:* ₹[Premium Amount]

Please make the payment at your earliest convenience to avoid any late fees or policy lapse.

For any queries, please contact us.

Thank you for choosing our services! 🙏
```

## LIC Dashboard Features

### Key Metrics
- Total Policies
- Active Policies
- Premium Due Today
- Total Premium Collected
- Total Sum Assured
- Policies Due This Month

### Charts and Visualizations
- Policy Status Distribution
- Policy Types Distribution
- Monthly Premium Collection (Last 6 Months)

### Data Tables
- Premium Due Today (with WhatsApp send buttons)
- Recent Policies

### Actions
- Send WhatsApp notifications to individual policies
- Send bulk notifications to all policies due today
- View detailed policy information

## User Access
- **LIC Users**: Redirected to `/lic-dashboard` after login
- **Admin/Regular Users**: Redirected to `/dashboard` after login
- **Navigation**: LIC users see "LIC Dashboard" in sidebar instead of regular dashboard

## Scheduled Jobs
- **Daily Premium Check**: Runs at 9:00 AM IST
- **Timezone**: Asia/Kolkata
- **Rate Limiting**: 2-second delay between messages

## Testing
1. Set a policy's `next_premium_date` to today's date
2. Ensure the policy has a mobile number
3. Use the manual trigger endpoints to test
4. Check server logs for notification status

## Requirements
- Policy must have `mobile` number
- Policy status must be `Active`
- `next_premium_date` must be today's date
