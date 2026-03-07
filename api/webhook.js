// api/webhook.js
// This runs on Vercel servers when Paystack sends payment confirmations
// All secrets are read from Vercel Environment Variables (see VERCEL_ENV_SETUP.md)

const crypto = require('crypto');

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const HUBTEL_CLIENT_ID = process.env.HUBTEL_CLIENT_ID;
const HUBTEL_CLIENT_SECRET = process.env.HUBTEL_CLIENT_SECRET;
const BUSINESS_PHONE = process.env.BUSINESS_PHONE || '+233509929436';

export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify the request is actually from Paystack
    const hash = crypto
      .createHmac('sha512', PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (!PAYSTACK_SECRET_KEY) {
      console.error('PAYSTACK_SECRET_KEY is not set');
      return res.status(500).json({ error: 'Server misconfiguration' });
    }
    if (hash !== req.headers['x-paystack-signature']) {
      console.error('Invalid signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const { event, data } = req.body;

    // Handle successful payment
    if (event === 'charge.success') {
      const { reference, customer, metadata, amount } = data;
      
      // Extract customer info from metadata
      const customFields = metadata?.custom_fields || [];
      const phone = customFields.find(f => f.variable_name === 'phone_number')?.value || customer.phone;
      const name = customFields.find(f => f.variable_name === 'customer_name')?.value || customer.email;
      const orderItems = customFields.find(f => f.variable_name === 'order_items')?.value;

      console.log('Payment received:', {
        reference,
        name,
        phone,
        amount: amount / 100,
      });

      // SMS to customer
      const customerMessage = `Thank you ${name} for ordering from Eat With Etor! Your payment of GHS ${(amount / 100).toFixed(2)} was successful. Ref: ${reference}. We're preparing your order now!`;
      
      await sendSMS(phone, customerMessage);

      // SMS to YOU (business owner)
      const businessMessage = `NEW ORDER!\nCustomer: ${name}\nPhone: ${phone}\nAmount: GHS ${(amount / 100).toFixed(2)}\nRef: ${reference}\nItems: ${orderItems || 'N/A'}`;
      
      await sendSMS(BUSINESS_PHONE, businessMessage);

      return res.status(200).json({ 
        success: true, 
        message: 'SMS sent successfully' 
      });
    }

    // Other events
    return res.status(200).json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

// Function to send SMS via Hubtel
async function sendSMS(phone, message) {
  try {
    // Make sure phone has country code
    let formattedPhone = phone;
    if (phone.startsWith('0')) {
      formattedPhone = '+233' + phone.substring(1);
    }

    if (!HUBTEL_CLIENT_ID || !HUBTEL_CLIENT_SECRET) {
      console.warn('Hubtel credentials not set; skipping SMS');
      return { skipped: true };
    }
    const auth = Buffer.from(`${HUBTEL_CLIENT_ID}:${HUBTEL_CLIENT_SECRET}`).toString('base64');
    
    const response = await fetch('https://smsc.hubtel.com/v1/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'EatWithEtor',
        to: formattedPhone,
        content: message
      })
    });

    const result = await response.json();
    console.log('SMS sent:', result);
    return result;

  } catch (error) {
    console.error('SMS send error:', error);
    throw error;
  }
}