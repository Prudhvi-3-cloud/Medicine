// backend.js
const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch'); // npm install node-fetch@2
const admin = require('firebase-admin'); // For Firebase Admin SDK
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Firebase Admin SDK with your service account
const serviceAccount = require('./service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

app.use(cors());
app.use(bodyParser.json());

// Your reCAPTCHA secret key (server side)
const RECAPTCHA_SECRET_KEY = '6LctT04rAAAAAB5yqEM9vPsbqP5T9pPD8LgrJ_Rs';

// Verify reCAPTCHA token middleware
async function verifyRecaptcha(req, res, next) {
  const token = req.body.recaptchaToken;
  if (!token) {
    return res.status(400).json({ error: 'reCAPTCHA token missing' });
  }

  try {
    const response = await fetch(`https://www.google.com/recaptcha/api/siteverify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${RECAPTCHA_SECRET_KEY}&response=${token}`
    });

    const data = await response.json();

    if (!data.success) {
      return res.status(400).json({ error: 'Failed reCAPTCHA verification' });
    }

    next();
  } catch (err) {
    return res.status(500).json({ error: 'Error verifying reCAPTCHA' });
  }
}


// Sign-up route
app.post('/signup', verifyRecaptcha, async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });

    res.json({ message: 'User created successfully', uid: userRecord.uid });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Sign-in route
// Firebase Admin SDK doesn't sign in users; client should do that.
// But you can verify credentials by using Firebase Auth REST API or let client handle.
// Here, for demonstration, we just verify recaptcha on sign-in and respond.
app.post('/signin', verifyRecaptcha, (req, res) => {
  // Normally, you handle sign-in on client side with Firebase SDK.
  // Here just respond OK for demo after recaptcha verification.
  res.json({ message: 'reCAPTCHA passed, proceed with Firebase client sign-in' });
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
