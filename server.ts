import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { INITIAL_ROOMS, INITIAL_BOOKINGS, INITIAL_PAST_PAYMENTS } from './src/data/seedData';
import { Room, Booking, Payment } from './src/types';

interface PMSStoreData {
  rooms: Room[];
  bookings: Booking[];
  pastPayments: Payment[];
  version: number;
  updatedAt: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'pms_store.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory store initialized from disk or default seed data
let pmsStore: PMSStoreData = {
  rooms: INITIAL_ROOMS,
  bookings: INITIAL_BOOKINGS,
  pastPayments: INITIAL_PAST_PAYMENTS,
  version: 1,
  updatedAt: new Date().toISOString(),
};

// Load existing data if available
try {
  if (fs.existsSync(DATA_FILE)) {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.rooms)) {
      pmsStore = {
        rooms: parsed.rooms,
        bookings: Array.isArray(parsed.bookings) ? parsed.bookings : [],
        pastPayments: Array.isArray(parsed.pastPayments) ? parsed.pastPayments : [],
        version: typeof parsed.version === 'number' ? parsed.version : 1,
        updatedAt: parsed.updatedAt || new Date().toISOString(),
      };
      console.log(`[PMS Server] Loaded existing state from disk: ${pmsStore.rooms.length} rooms, ${pmsStore.bookings.length} bookings.`);
    }
  } else {
    // Write initial state to disk
    fs.writeFileSync(DATA_FILE, JSON.stringify(pmsStore, null, 2), 'utf-8');
    console.log('[PMS Server] Initialized new PMS database file on disk.');
  }
} catch (err) {
  console.error('[PMS Server] Error loading PMS store from disk:', err);
}

// Helper to save store atomically
function saveStoreToDisk(): void {
  try {
    pmsStore.version += 1;
    pmsStore.updatedAt = new Date().toISOString();
    const tempFile = `${DATA_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(pmsStore, null, 2), 'utf-8');
    fs.renameSync(tempFile, DATA_FILE);
  } catch (err) {
    console.error('[PMS Server] Failed to save PMS store to disk:', err);
  }
}

// SSE Clients set
const sseClients = new Set<express.Response>();

function broadcastState(): void {
  const payload = `data: ${JSON.stringify({
    type: 'STATE_CHANGED',
    data: {
      rooms: pmsStore.rooms,
      bookings: pmsStore.bookings,
      pastPayments: pmsStore.pastPayments,
      version: pmsStore.version,
      updatedAt: pmsStore.updatedAt,
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

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      lodge: 'Sri Bhavani Vasavi Bhavan PMS',
      roomsCount: pmsStore.rooms.length,
      bookingsCount: pmsStore.bookings.length,
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
    });
  });

  // POST sync state: updates rooms, bookings, and payments, writes to disk, and broadcasts to all devices
  app.post('/api/pms/sync', (req, res) => {
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

      saveStoreToDisk();
      broadcastState();

      res.json({
        success: true,
        version: pmsStore.version,
        updatedAt: pmsStore.updatedAt,
      });
    } catch (err: any) {
      console.error('[PMS Server] Failed to sync state:', err);
      res.status(500).json({ error: err.message || 'Internal server error while syncing state' });
    }
  });

  // POST reset to seed demo data (Protected with administrator password)
  app.post('/api/pms/reset', (req, res) => {
    try {
      const { password } = req.body || {};
      if (password !== 'Gvminfotech!@#@14356789') {
        return res.status(401).json({ error: 'Unauthorized: Incorrect administrator password' });
      }

      pmsStore.rooms = INITIAL_ROOMS;
      pmsStore.bookings = INITIAL_BOOKINGS;
      pmsStore.pastPayments = INITIAL_PAST_PAYMENTS;
      saveStoreToDisk();
      broadcastState();
      res.json({
        success: true,
        version: pmsStore.version,
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
  app.post('/api/pms/clear-ledger', (req, res) => {
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
      saveStoreToDisk();
      broadcastState();
      res.json({
        success: true,
        version: pmsStore.version,
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
        data: {
          rooms: pmsStore.rooms,
          bookings: pmsStore.bookings,
          pastPayments: pmsStore.pastPayments,
          version: pmsStore.version,
          updatedAt: pmsStore.updatedAt,
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
