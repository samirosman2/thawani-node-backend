// server.js
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(express.json());

// ====== ENV ======
const PORT = process.env.PORT || 3000;
const THAWANI_SECRET_KEY = process.env.THAWANI_SECRET_KEY || '';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*'; // e.g. https://<your>.lovableproject.com
const SUCCESS_URL =
  process.env.SUCCESS_URL ||
  'https://f09ea1a4-822e-488c-97a7-3b8dd5479d46.lovableproject.com/success';
const CANCEL_URL =
  process.env.CANCEL_URL ||
  'https://f09ea1a4-822e-488c-97a7-3b8dd5479d46.lovableproject.com/cancel';

// ====== CORS (allow Lovable) ======
app.use(
  cors({
    origin: ALLOWED_ORIGIN === '*' ? '*' : [ALLOWED_ORIGIN],
    methods: ['POST', 'GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  })
);

// ====== Auto switch TEST/LIVE by key ======
const isTestKey = THAWANI_SECRET_KEY.startsWith('thw_test_');
const THAWANI_BASE = isTestKey
  ? 'https://uatcheckout.thawani.om/api/v1'
  : 'https://checkout.thawani.om/api/v1';

// ====== Health & simple GET test ======
app.get('/', (_req, res) => {
  res.json({ ok: true, mode: isTestKey ? 'TEST' : 'LIVE' });
});

// Just to avoid confusion when opening this endpoint in a browser:
app.get('/create-thawani-session', (_req, res) => {
  res
    .status(405)
    .send('Use POST /create-thawani-session (triggered by your Lovable button).');
});

// ====== Create checkout session ======
app.post('/create-thawani-session', async (_req, res) => {
  try {
    const payload = {
      client_reference_id: 'user_' + Date.now(),
      mode: 'payment',
      products: [
        {
          name: 'Stride for Nature Registration',
          quantity: 1,
          unit_amount: 600, // 600 baisa = 6 OMR
        },
      ],
      success_url: SUCCESS_URL,
      cancel_url: CANCEL_URL,
    };

    console.log('Creating session =>', {
      base: THAWANI_BASE,
      mode: isTestKey ? 'TEST' : 'LIVE',
      success_url: SUCCESS_URL,
      cancel_url: CANCEL_URL,
    });

    const r = await axios.post(`${THAWANI_BASE}/checkout/session`, payload, {
      headers: {
        'Content-Type': 'application/json',
        'thawani-api-key': THAWANI_SECRET_KEY,
      },
      timeout: 15000,
    });

    console.log('Session created:', r.data);
    res.json(r.data);
  } catch (error) {
    const err = error?.response?.data || { message: error.message };
    console.error('Thawani error:', err);
    // TEMP: return full error to help debug in Lovable popup
    res.status(400).json({ success: false, error: err });
  }
});

// ====== Webhook (optional; configure in Thawani portal) ======
app.post('/webhook/thawani', (req, res) => {
  try {
    console.log('Webhook event:', req.body);
    // TODO: verify signature (if provided) and mark payment as paid in your DB/Sheet
    res.status(200).send('ok');
  } catch (e) {
    console.error('Webhook handler error:', e.message);
    res.status(200).send('ok');
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`Mode: ${isTestKey ? 'TEST (UAT)' : 'LIVE'}`);
});
