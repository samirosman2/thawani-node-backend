const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const THAWANI_SECRET_KEY = process.env.THAWANI_SECRET_KEY;

// Auto-select base URL depending on whether key is test or live
const isTestKey = THAWANI_SECRET_KEY.startsWith('thw_test_');
const THAWANI_BASE_URL = isTestKey
  ? 'https://uatcheckout.thawani.om/api/v1'
  : 'https://checkout.thawani.om/api/v1';

app.post('/create-thawani-session', async (req, res) => {
  try {
    const response = await axios.post(
      `${THAWANI_BASE_URL}/checkout/session`,
      {
        client_reference_id: 'user_' + Date.now(), // unique reference
        mode: 'payment',
        products: [
          {
            name: 'Stride for Nature Registration',
            quantity: 1,
            unit_amount: 600 // in baisa (600 baisa = 6 OMR)
          }
        ],
        success_url: 'https://your-lovable-page.com/success',
        cancel_url: 'https://your-lovable-page.com/cancel'
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'thawani-api-key': THAWANI_SECRET_KEY
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Error creating Thawani session:', error?.response?.data || error.message);
    res.status(500).json({ success: false, error: 'Payment session creation failed' });
  }
});

// Optional: Webhook endpoint to receive payment status updates from Thawani
app.post('/webhook/thawani', async (req, res) => {
  try {
    console.log('Webhook event from Thawani:', req.body);
    // TODO: process payment status here
    res.status(200).send('ok');
  } catch (e) {
    console.error('Webhook error:', e.message);
    res.status(200).send('ok'); // Acknowledge anyway to avoid retries
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`Mode: ${isTestKey ? 'TEST (UAT)' : 'LIVE'}`);
});
