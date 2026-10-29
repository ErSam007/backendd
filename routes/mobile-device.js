import express from 'express';
import mongoose from 'mongoose';
import Expense from '../models/Expense.js';
import { dbFallback } from '../dbFallback.js';

const router = express.Router();

// Campus Pre-configured BLE Beacons
const CAMPUS_BEACONS = [
  {
    id: 'beacon-cafe-01',
    name: 'Campus Central Cafeteria',
    uuid: 'FDA50693-A4E2-4FB1-AFCF-C6EB07647825',
    major: 10,
    minor: 1,
    zone: 'Food & Dining',
    category: 'Food',
    merchant: 'College Central Canteen',
    defaultAmount: 85,
    rssiThreshold: -75, // closer than -75 dBm is considered inside
    description: 'Main campus food court and lunch counter'
  },
  {
    id: 'beacon-library-02',
    name: 'Library Xerox & Stationery',
    uuid: 'FDA50693-A4E2-4FB1-AFCF-C6EB07647826',
    major: 10,
    minor: 2,
    zone: 'Education',
    category: 'Education',
    merchant: 'Campus Digital Library Print Hub',
    defaultAmount: 25,
    rssiThreshold: -70,
    description: 'Printing, binding and educational supplies counter'
  },
  {
    id: 'beacon-bookstore-03',
    name: 'College Academic Bookstore',
    uuid: 'FDA50693-A4E2-4FB1-AFCF-C6EB07647827',
    major: 10,
    minor: 3,
    zone: 'Books & Supplies',
    category: 'Books',
    merchant: 'Student Co-op Bookstore',
    defaultAmount: 240,
    rssiThreshold: -75,
    description: 'Textbooks, lab manuals, stationery'
  },
  {
    id: 'beacon-gym-04',
    name: 'Sports Complex & Gym Canteen',
    uuid: 'FDA50693-A4E2-4FB1-AFCF-C6EB07647828',
    major: 10,
    minor: 4,
    zone: 'Fitness & Health',
    category: 'Personal Care',
    merchant: 'Campus Arena Energy Bar',
    defaultAmount: 60,
    rssiThreshold: -72,
    description: 'Protein shakes, electrolytes & hydration drinks'
  },
  {
    id: 'beacon-laundry-05',
    name: 'Hostel Smart Laundromat',
    uuid: 'FDA50693-A4E2-4FB1-AFCF-C6EB07647829',
    major: 10,
    minor: 5,
    zone: 'Hostel & Living',
    category: 'Hostel',
    merchant: 'Hostel Block-B Smart Wash',
    defaultAmount: 40,
    rssiThreshold: -68,
    description: 'Automated tokenless washing and drying units'
  }
];

// Sample Pre-registered NFC Campus Tags
let REGISTERED_NFC_TAGS = [
  {
    tagId: 'NFC-STU-CARD-9901',
    label: 'Student Smart ID Card (RFID/NFC)',
    userId: 'mock-user-1',
    cardType: 'Student ID',
    linkedWallet: 'Campus Canteen Pre-paid Balance',
    balance: 850
  },
  {
    tagId: 'NFC-CANTEEN-MEAL-02',
    label: 'Campus Canteen Quick Meal Tag',
    merchant: 'College Central Canteen',
    category: 'Food',
    defaultAmount: 80
  },
  {
    tagId: 'NFC-PRINT-XEROX-03',
    label: 'Print & Xerox Terminal Sticker',
    merchant: 'Campus Digital Library Print Hub',
    category: 'Education',
    defaultAmount: 20
  }
];

// Active Mobile Pairings memory store
const ACTIVE_PAIRINGS = new Map();

// 1. Get Campus BLE Beacons
router.get('/beacons', (req, res) => {
  res.json({
    success: true,
    beacons: CAMPUS_BEACONS,
    count: CAMPUS_BEACONS.length
  });
});

// 2. NFC Tap Handler -> Directly logs expense or reads card data
router.post('/nfc/tap', async (req, res) => {
  try {
    const { 
      tagId, 
      merchant = 'Campus NFC Terminal', 
      amount = 50, 
      category = 'Food', 
      description = 'NFC Tap-to-Pay Transaction',
      userId,
      paymentMethod = 'NFC Tap',
      rawNfcPayload
    } = req.body;

    const isMongoConnected = mongoose.connection.readyState === 1;

    const expensePayload = {
      userId: userId || '60c72b2f9b1d8b2bad000001',
      amount: parseFloat(amount) || 50,
      category: category || 'Food',
      description: `${description} [Tag: ${tagId || 'NFC-DEVICE'}]`,
      date: new Date().toISOString(),
      paymentMethod: paymentMethod || 'NFC Tap',
      merchant: merchant || 'Campus NFC Merchant',
      tags: ['NFC', 'Contactless', 'Mobile-Sync']
    };

    let savedExpense = null;
    if (isMongoConnected) {
      savedExpense = new Expense(expensePayload);
      await savedExpense.save();
    } else {
      savedExpense = dbFallback.create('expenses', expensePayload);
    }

    res.json({
      success: true,
      message: `NFC Tap successful! Recorded ₹${expensePayload.amount} at ${expensePayload.merchant}.`,
      expense: savedExpense,
      tag: {
        tagId: tagId || 'NFC-STU-AUTO',
        verified: true,
        protocol: 'ISO/IEC 14443 Type A (NDEF)'
      }
    });
  } catch (error) {
    console.error('NFC Tap error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. BLE Proximity Beacon Detection Tracker
router.post('/ble/encounter', (req, res) => {
  try {
    const { beaconId, rssi = -65, distance = 1.2, userId } = req.body;
    const beacon = CAMPUS_BEACONS.find(b => b.id === beaconId) || {
      id: beaconId || 'custom-beacon',
      name: 'Nearby Campus BLE Transmitter',
      zone: 'Campus Perimeter',
      category: 'Others',
      merchant: 'Nearby Merchant',
      defaultAmount: 50
    };

    // Calculate approximate distance if not provided
    // Path loss model: d = 10 ^ ((Measured Power - RSSI) / (10 * N))
    const proximityTier = Math.abs(rssi) < 60 ? 'Immediate (< 1m)' : Math.abs(rssi) < 78 ? 'Near (1m - 3m)' : 'Far (> 3m)';

    res.json({
      success: true,
      beacon,
      telemetry: {
        rssi,
        proximity: proximityTier,
        distanceMeters: distance || (Math.pow(10, (-59 - rssi) / (10 * 2))).toFixed(2),
        timestamp: new Date().toISOString()
      },
      quickExpenseSuggestion: {
        category: beacon.category,
        merchant: beacon.merchant,
        suggestedAmount: beacon.defaultAmount,
        reason: `Detected nearby beacon "${beacon.name}" within ${proximityTier}`
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Get Registered NFC Tags for a student
router.get('/tags/:userId', (req, res) => {
  const { userId } = req.params;
  const userTags = REGISTERED_NFC_TAGS.filter(t => !t.userId || t.userId === userId || t.userId === 'mock-user-1');
  res.json({
    success: true,
    tags: userTags
  });
});

// 5. Register a New NFC Tag or Student ID
router.post('/tags', (req, res) => {
  const { tagId, label, userId, merchant, category, defaultAmount } = req.body;
  if (!tagId) {
    return res.status(400).json({ success: false, error: 'Tag ID is required' });
  }

  const newTag = {
    tagId,
    label: label || `Custom Campus Tag ${tagId.slice(-4)}`,
    userId: userId || 'student-user',
    merchant: merchant || 'Campus Outlet',
    category: category || 'Others',
    defaultAmount: parseFloat(defaultAmount) || 50,
    registeredAt: new Date().toISOString()
  };

  REGISTERED_NFC_TAGS.push(newTag);
  res.json({ success: true, tag: newTag });
});

// 6. Mobile Pairing Token Generation & Verification
router.post('/pair/generate', (req, res) => {
  const { userId = 'student-user' } = req.body;
  const pairCode = Math.floor(100000 + Math.random() * 900000).toString();
  const pairToken = 'PAIR-' + Math.random().toString(36).substring(2, 10).toUpperCase();

  ACTIVE_PAIRINGS.set(pairCode, {
    userId,
    pairToken,
    expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
  });

  res.json({
    success: true,
    pairCode,
    pairToken,
    expiresInSeconds: 600
  });
});

router.post('/pair/verify', (req, res) => {
  const { pairCode } = req.body;
  const pairing = ACTIVE_PAIRINGS.get(pairCode);

  if (!pairing) {
    return res.status(400).json({ success: false, error: 'Invalid or expired pair code' });
  }

  if (Date.now() > pairing.expiresAt) {
    ACTIVE_PAIRINGS.delete(pairCode);
    return res.status(400).json({ success: false, error: 'Pair code has expired' });
  }

  res.json({
    success: true,
    message: 'Mobile App paired successfully!',
    userId: pairing.userId,
    sessionToken: pairing.pairToken
  });
});

export default router;

