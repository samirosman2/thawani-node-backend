const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const THAWANI_SECRET_KEY = process.env.THAWANI_SECRET_KEY; // set on Render

app.post('/create-thawani-session', async (req, res) => {
  try {
    const response = await axios.post(
      'https://uatcheckout.thawani.om/api/v1/checkout/session',
      {
        client_reference_id: 'test_user_123',
        mode: 'payment',
        products: [{ name: 'Stride for Nature Registration', quantity: 1, unit_amount: 600 }],
        success_url: 'https://example.com/success',
        cancel_url: 'https://example.com/cancel'
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
    console.error('Thawani error:', error?.response?.data || error.message);
    res.status(500).json({ success: false, error: 'Payment session creation failed' });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
