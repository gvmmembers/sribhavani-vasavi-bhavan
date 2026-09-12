import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { MongoClient, Db } from 'mongodb';
import { createServer as createViteServer } from 'vite';
import { INITIAL_ROOMS, INITIAL_BOOKINGS, INITIAL_PAST_PAYMENTS } from './src/data/seedData';
import { Room, Booking, Payment } from './src/types';

interface PMSStoreData {
  rooms: Room[];
  bookings: Booking[];
  pastPayments: Payment[];
  version: number;
  updatedAt: string;
  lastClearedAt?: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'pms_store.json');
const BACKUP_FILE = path.join(DATA_DIR, 'pms_store.backup.json');

// In-memory store initialized from seed data
let pmsStore: PMSStoreData = {
  rooms: INITIAL_ROOMS,
  bookings: INITIAL_BOOKINGS,
  pastPayments: INITIAL_PAST_PAYMENTS,
  version: 1,
  updatedAt: new Date().toISOString(),
};

// MongoDB connection reference
let mongoClient: MongoClient | null = null;
let mongoDb: Db | null = null;
let isMongoConnected = false;

const MONGODB_URI = (process.env.MONGODB_URI || '').trim().replace(/^["']|["']$/g, '');
const DB_NAME = (process.env.MONGODB_DB_NAME || 'sribhavani_vasavi_pms').trim().replace(/^["']|["']$/g, '');
const STORE_DOC_ID = 'current_pms_store';

// SSE Clients set
const sseClients = new Set<express.Response>();

function broadcastState(isReset = false): void {
  const payload = `data: ${JSON.stringify({
    type: 'STATE_CHANGED',
    isReset,
    data: {
      rooms: pmsStore.rooms,
      bookings: pmsStore.bookings,
      pastPayments: pmsStore.pastPayments,
      version: pmsStore.version,
      updatedAt: pmsStore.updatedAt,
      lastClearedAt: pmsStore.lastClearedAt,
    },
  })}\n\n`;

  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

// Local disk fallback loader
function loadLocalStore(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    let fileToLoad: string | null = null;
    if (fs.existsSync(DATA_FILE)) {
      fileToLoad = DATA_FILE;
    } else if (fs.existsSync(BACKUP_FILE)) {
      console.warn('[PMS Server] Primary data file missing, loading from secondary backup...');
      fileToLoad = BACKUP_FILE;
    }

    if (fileToLoad) {
      const raw = fs.readFileSync(fileToLoad, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.rooms)) {
        pmsStore = {
          rooms: parsed.rooms,
          bookings: Array.isArray(parsed.bookings) ? parsed.bookings : [],
          pastPayments: Array.isArray(parsed.pastPayments) ? parsed.pastPayments : [],
          version: typeof parsed.version === 'number' ? parsed.version : 1,
          updatedAt: parsed.updatedAt || new Date().toISOString(),
          lastClearedAt: parsed.lastClearedAt || undefined,
        };
        console.log(`[PMS Server] Loaded existing state from disk: ${pmsStore.rooms.length} rooms, ${pmsStore.bookings.length} bookings.`);
      }
    } else {
      fs.writeFileSync(DATA_FILE, JSON.stringify(pmsStore, null, 2), 'utf-8');
      fs.writeFileSync(BACKUP_FILE, JSON.stringify(pmsStore, null, 2), 'utf-8');
      console.log('[PMS Server] Initialized new PMS database file on disk.');
    }
  } catch (err) {
    console.error('[PMS Server] Error loading PMS store from disk:', err);
  }
}

// Initialize and connect to MongoDB Atlas
async function initDatabase(): Promise<void> {
  if (!MONGODB_URI) {
    console.log('[PMS Database] No MONGODB_URI configured. Running with local disk storage.');
    loadLocalStore();
    return;
  }

  try {
    console.log('[PMS Database] Connecting to MongoDB Atlas Cloud Database...');
    mongoClient = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
    });
    await mongoClient.connect();
    mongoDb = mongoClient.db(DB_NAME);
    isMongoConnected = true;
    console.log(`[PMS Database] ✅ Connected successfully to MongoDB Atlas database: "${DB_NAME}".`);

    // Fetch existing live state from MongoDB
    const collection = mongoDb.collection('pms_store');
    const cloudDoc = await collection.findOne({ _id: STORE_DOC_ID as any });

    if (cloudDoc && Array.isArray(cloudDoc.rooms)) {
      pmsStore = {
        rooms: cloudDoc.rooms,
        bookings: Array.isArray(cloudDoc.bookings) ? cloudDoc.bookings : [],
        pastPayments: Array.isArray(cloudDoc.pastPayments) ? cloudDoc.pastPayments : [],
        version: typeof cloudDoc.version === 'number' ? cloudDoc.version : 1,
        updatedAt: cloudDoc.updatedAt || new Date().toISOString(),
        lastClearedAt: cloudDoc.lastClearedAt || undefined,
      };
      console.log(
        `[PMS Database] ✅ Loaded state from cloud: ${pmsStore.rooms.length} rooms, ${pmsStore.bookings.length} bookings, ${pmsStore.pastPayments.length} payments (v${pmsStore.version}).`
      );
    } else {
      // Seed initial data into cloud database
      console.log('[PMS Database] Initializing cloud database with default room blueprint...');
      await collection.replaceOne(
        { _id: STORE_DOC_ID as any },
        { _id: STORE_DOC_ID, ...pmsStore },
        { upsert: true }
      );
      console.log('[PMS Database] ✅ Initialized new cloud PMS state in MongoDB.');
    }
  } catch (err: any) {
    console.error('[PMS Database] ⚠️ Failed to connect to MongoDB Atlas:', err.message);
    console.warn('[PMS Database] Falling back to local disk storage...');
    isMongoConnected = false;
    loadLocalStore();
  }
}

// Persist store to MongoDB Atlas AND secondary local backup
async function persistStore(): Promise<void> {
  pmsStore.version += 1;
  pmsStore.updatedAt = new Date().toISOString();

  // 1. Persist to MongoDB Atlas Cloud Database
  if (isMongoConnected && mongoDb) {
    try {
      const collection = mongoDb.collection('pms_store');
      await collection.replaceOne(
        { _id: STORE_DOC_ID as any },
        { _id: STORE_DOC_ID, ...pmsStore },
        { upsert: true }
      );
    } catch (err: any) {
      console.error('[PMS Database] ⚠️ Failed to save state to MongoDB Atlas:', err.message);
    }
  }

  // 2. Persist to local disk as secondary safety net
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempFile = `${DATA_FILE}.tmp`;
    const serialized = JSON.stringify(pmsStore, null, 2);
    fs.writeFileSync(tempFile, serialized, 'utf-8');
    fs.renameSync(tempFile, DATA_FILE);
    fs.writeFileSync(BACKUP_FILE, serialized, 'utf-8');
  } catch (err) {
    console.error('[PMS Server] Failed to save local disk backup:', err);
  }
}

async function startServer() {
  await initDatabase();

  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      lodge: 'Sri Bhavani Vasavi Bhavan PMS',
      database: isMongoConnected ? 'MongoDB Atlas (Cloud)' : 'Local Disk Storage',
      isCloudDatabaseConnected: isMongoConnected,
      roomsCount: pmsStore.rooms.length,
      bookingsCount: pmsStore.bookings.length,
      paymentsCount: pmsStore.pastPayments.length,
      version: pmsStore.version,
      uptime: process.uptime(),
    });
  });

  // GET current PMS state (for initial fetch or polling)
  app.get('/api/pms/state', (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.json({
      rooms: pmsStore.rooms,
      bookings: pmsStore.bookings,
      pastPayments: pmsStore.pastPayments,
      version: pmsStore.version,
      updatedAt: pmsStore.updatedAt,
      lastClearedAt: pmsStore.lastClearedAt,
      isCloudDatabaseConnected: isMongoConnected,
    });
  });

  // Database connection status check
  app.get('/api/pms/db-status', (req, res) => {
    res.json({
      connected: isMongoConnected,
      databaseType: isMongoConnected ? 'MongoDB Atlas (Cloud)' : 'Local Disk Storage',
      databaseName: isMongoConnected ? DB_NAME : 'Local filesystem',
      hasMongoUriConfigured: Boolean(process.env.MONGODB_URI),
      records: {
        rooms: pmsStore.rooms.length,
        bookings: pmsStore.bookings.length,
        payments: pmsStore.pastPayments.length,
        version: pmsStore.version,
        updatedAt: pmsStore.updatedAt,
      },
    });
  });

  // POST sync state: updates rooms, bookings, and payments, writes to database, and broadcasts to all devices
  app.post('/api/pms/sync', async (req, res) => {
    try {
      const { rooms, bookings, pastPayments } = req.body;

      if (!rooms || !Array.isArray(rooms)) {
        return res.status(400).json({ error: 'Invalid rooms data array' });
      }

      pmsStore.rooms = rooms;
      if (Array.isArray(bookings)) {
        pmsStore.bookings = bookings;
      }
      if (Array.isArray(pastPayments)) {
        pmsStore.pastPayments = pastPayments;
      }

      await persistStore();
      broadcastState(false);

      console.log(
        `[PMS Server] State synchronized (${isMongoConnected ? 'MongoDB Cloud' : 'Local Disk'}): ${rooms.length} rooms, ${pmsStore.bookings.length} bookings, ${pmsStore.pastPayments.length} payments (v${pmsStore.version}).`
      );

      res.json({
        success: true,
        version: pmsStore.version,
        updatedAt: pmsStore.updatedAt,
        lastClearedAt: pmsStore.lastClearedAt,
        isCloudDatabaseConnected: isMongoConnected,
      });
    } catch (err: any) {
      console.error('[PMS Server] Failed to sync state:', err);
      res.status(500).json({ error: err.message || 'Internal server error while syncing state' });
    }
  });

  // POST reset to seed demo data (Protected with administrator password)
  app.post('/api/pms/reset', async (req, res) => {
    try {
      const { password } = req.body || {};
      if (password !== 'Gvminfotech!@#@14356789') {
        return res.status(401).json({ error: 'Unauthorized: Incorrect administrator password' });
      }

      pmsStore.rooms = INITIAL_ROOMS;
      pmsStore.bookings = INITIAL_BOOKINGS;
      pmsStore.pastPayments = INITIAL_PAST_PAYMENTS;
      pmsStore.lastClearedAt = new Date().toISOString();
      await persistStore();
      broadcastState(true);
      console.log('[PMS Server] Admin executed Reset to Sample Data.');
      res.json({
        success: true,
        version: pmsStore.version,
        lastClearedAt: pmsStore.lastClearedAt,
        data: {
          rooms: pmsStore.rooms,
          bookings: pmsStore.bookings,
          pastPayments: pmsStore.pastPayments,
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST clear ledger: clears all bookings and payments, resets rooms to AVAILABLE (Protected with administrator password)
  app.post('/api/pms/clear-ledger', async (req, res) => {
    try {
      const { password } = req.body || {};
      if (password !== 'Gvminfotech!@#@14356789') {
        return res.status(401).json({ error: 'Unauthorized: Incorrect administrator password' });
      }

      pmsStore.bookings = [];
      pmsStore.pastPayments = [];
      pmsStore.rooms = pmsStore.rooms.map((r) => ({
        ...r,
        status: 'AVAILABLE',
        currentBookingId: null,
        maintenanceReason: undefined,
      }));
      pmsStore.lastClearedAt = new Date().toISOString();
      await persistStore();
      broadcastState(true);
      console.log('[PMS Server] Admin executed Clear Ledger.');
      res.json({
        success: true,
        version: pmsStore.version,
        lastClearedAt: pmsStore.lastClearedAt,
        data: {
          rooms: pmsStore.rooms,
          bookings: pmsStore.bookings,
          pastPayments: pmsStore.pastPayments,
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET Server-Sent Events stream for instant cross-device updates
  app.get('/api/pms/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // Send initial snapshot
    res.write(
      `data: ${JSON.stringify({
        type: 'INIT',
        isReset: false,
        data: {
          rooms: pmsStore.rooms,
          bookings: pmsStore.bookings,
          pastPayments: pmsStore.pastPayments,
          version: pmsStore.version,
          updatedAt: pmsStore.updatedAt,
          lastClearedAt: pmsStore.lastClearedAt,
          isCloudDatabaseConnected: isMongoConnected,
        },
      })}\n\n`
    );

    sseClients.add(res);

    req.on('close', () => {
      sseClients.delete(res);
    });
  });

  // Heartbeat to prevent stale connections across NAT/firewalls
  setInterval(() => {
    for (const client of sseClients) {
      try {
        client.write(':heartbeat\n\n');
      } catch {
        sseClients.delete(client);
      }
    }
  }, 20000);

  // Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[PMS Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
