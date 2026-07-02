const dns = require('dns');

// Force Node.js to use public DNS and IPv4 resolution before loading any dependencies
try {
  dns.setDefaultResultOrder('ipv4first');
  dns.setServers(['1.1.1.1', '8.8.8.8']);
} catch (e) {
  console.warn('DNS initialization warning:', e.message);
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

require('dotenv').config({ override: true });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Static Frontend Assets
app.use(express.static(path.join(__dirname, 'public')));

// Database Connection
let isMongoConnected = false;
const mongoURI = process.env.MONGODB_URI;

if (mongoURI) {
  console.log('Attempting to connect to MongoDB...');
  mongoose.connect(mongoURI)
    .then(() => {
      console.log('Successfully connected to MongoDB Atlas/Local.');
      isMongoConnected = true;
    })
    .catch((err) => {
      console.error('MongoDB connection error:', err.message);
      console.log('Server will run with in-memory storage fallback.');
    });
} else {
  console.log('No MONGODB_URI environment variable detected. Running with in-memory storage fallback.');
}

// In-Memory Database Fallback for development
const memoryDb = {
  inquiries: [],
  contacts: [],
  subscribers: [],
  bmiHistory: []
};

// Models (Imported safely to handle Mongoose errors if any)
const Inquiry = require('./models/Inquiry');
const Contact = require('./models/Contact');
const Subscriber = require('./models/Subscriber');
const Bmi = require('./models/Bmi');

// --- API ROUTES ---

// 1. Membership Inquiry Form Submission
app.post('/api/inquiry', async (req, res) => {
  try {
    const { name, email, phone, plan, message } = req.body;

    if (!name || !email || !phone || !plan) {
      return res.status(400).json({ success: false, message: 'Please fill in all required fields.' });
    }

    const inquiryData = { name, email, phone, plan, message, createdAt: new Date() };

    if (isMongoConnected) {
      const newInquiry = new Inquiry(inquiryData);
      await newInquiry.save();
    } else {
      memoryDb.inquiries.push(inquiryData);
      console.log('[Dev In-Memory DB] Saved Inquiry:', inquiryData);
    }

    return res.status(201).json({
      success: true,
      message: `Thank you, ${name}! Your inquiry for the ${plan} plan has been received. Our team will contact you shortly.`
    });
  } catch (error) {
    console.error('Inquiry Submission Error:', error);
    return res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
  }
});

// 2. Contact Form Submission
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Please fill in all required fields.' });
    }

    const contactData = { name, email, phone, subject: subject || 'General Inquiry', message, createdAt: new Date() };

    if (isMongoConnected) {
      const newContact = new Contact(contactData);
      await newContact.save();
    } else {
      memoryDb.contacts.push(contactData);
      console.log('[Dev In-Memory DB] Saved Contact:', contactData);
    }

    return res.status(201).json({
      success: true,
      message: `Message sent successfully. Thank you for contacting Iron Pulse Fitness, ${name}!`
    });
  } catch (error) {
    console.error('Contact Submission Error:', error);
    return res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
  }
});

// 3. Newsletter Subscription Form
app.post('/api/newsletter', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    const subscriberData = { email, createdAt: new Date() };

    if (isMongoConnected) {
      // Check if subscriber already exists
      const existing = await Subscriber.findOne({ email: email.toLowerCase() });
      if (existing) {
        return res.status(400).json({ success: false, message: 'This email is already subscribed!' });
      }
      const newSubscriber = new Subscriber(subscriberData);
      await newSubscriber.save();
    } else {
      const existing = memoryDb.subscribers.find(s => s.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        return res.status(400).json({ success: false, message: 'This email is already subscribed!' });
      }
      memoryDb.subscribers.push(subscriberData);
      console.log('[Dev In-Memory DB] Subscribed email:', subscriberData);
    }

    return res.status(201).json({
      success: true,
      message: 'Welcome to the Pulse! You have successfully subscribed to our newsletter.'
    });
  } catch (error) {
    console.error('Newsletter Subscription Error:', error);
    return res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
  }
});

// 4. Save BMI History Record
app.post('/api/bmi', async (req, res) => {
  try {
    const { height, weight, age, gender, bmi, category } = req.body;

    if (!height || !weight || !age || !gender || !bmi || !category) {
      return res.status(400).json({ success: false, message: 'Missing required BMI parameters.' });
    }

    const bmiData = { height, weight, age, gender, bmi, category, createdAt: new Date() };

    if (isMongoConnected) {
      const newBmiRecord = new Bmi(bmiData);
      await newBmiRecord.save();
    } else {
      memoryDb.bmiHistory.push(bmiData);
      console.log('[Dev In-Memory DB] Saved BMI History:', bmiData);
    }

    return res.status(201).json({
      success: true,
      message: 'BMI calculation successfully logged.'
    });
  } catch (error) {
    console.error('BMI Save Error:', error);
    return res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
  }
});

// 5. GET endpoint for BMI history (Optional, lets user view logs)
app.get('/api/bmi/history', async (req, res) => {
  try {
    let history = [];
    if (isMongoConnected) {
      history = await Bmi.find().sort({ createdAt: -1 }).limit(10);
    } else {
      history = [...memoryDb.bmiHistory].reverse().slice(0, 10);
    }
    return res.json({ success: true, history });
  } catch (error) {
    console.error('BMI History Fetch Error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// --- SUBPAGE ROUTINGS FOR MULTI-PAGE APPLICATION ---
app.get('/about', (req, res) => res.sendFile(path.join(__dirname, 'public', 'about.html')));
app.get('/programs', (req, res) => res.sendFile(path.join(__dirname, 'public', 'programs.html')));
app.get('/membership', (req, res) => res.sendFile(path.join(__dirname, 'public', 'membership.html')));
app.get('/trainers', (req, res) => res.sendFile(path.join(__dirname, 'public', 'trainers.html')));
app.get('/schedule', (req, res) => res.sendFile(path.join(__dirname, 'public', 'schedule.html')));
app.get('/bmi', (req, res) => res.sendFile(path.join(__dirname, 'public', 'bmi.html')));
app.get('/gallery', (req, res) => res.sendFile(path.join(__dirname, 'public', 'gallery.html')));
app.get('/testimonials', (req, res) => res.sendFile(path.join(__dirname, 'public', 'testimonials.html')));
app.get('/blog', (req, res) => res.sendFile(path.join(__dirname, 'public', 'blog.html')));
app.get('/contact', (req, res) => res.sendFile(path.join(__dirname, 'public', 'contact.html')));

// Catch-all route to serve static index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` IRON PULSE FITNESS SERVER STARTED            `);
  console.log(` Port: http://localhost:${PORT}                 `);
  console.log(` Database: ${isMongoConnected ? 'MongoDB Connected' : 'In-Memory Backup Active'}`);
  console.log(`===============================================`);
});
