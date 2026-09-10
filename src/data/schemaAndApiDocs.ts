export const SQL_SCHEMA_POSTGRES = `-- =========================================================================
-- SRI BHAVANI VASAVI BHAVAN - PROPERTY MANAGEMENT SYSTEM (PMS)
-- PostgreSQL Production Database DDL Schema
-- Location: Tiruvannamalai, Tamil Nadu
-- Inventory: 11 Rooms (Ground Floor: 101-105, 111; First Floor: 106-110)
-- =========================================================================

-- Enable UUID extension for cryptographic identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ROOMS TABLE
CREATE TYPE room_type_enum AS ENUM ('AC', 'NON_AC');
CREATE TYPE room_status_enum AS ENUM ('AVAILABLE', 'OCCUPIED', 'CLEANING_NEEDED', 'MAINTENANCE');

CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_number VARCHAR(10) NOT NULL UNIQUE,
    floor INTEGER NOT NULL CHECK (floor IN (1, 2)),
    room_type room_type_enum NOT NULL,
    bed_type VARCHAR(50) NOT NULL DEFAULT 'Double Bed',
    base_rate NUMERIC(10, 2) NOT NULL CHECK (base_rate > 0),
    max_occupancy INTEGER NOT NULL DEFAULT 2 CHECK (max_occupancy > 0),
    status room_status_enum NOT NULL DEFAULT 'AVAILABLE',
    maintenance_reason TEXT,
    last_cleaned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. GUESTS TABLE
CREATE TYPE id_proof_enum AS ENUM ('Aadhaar', 'Voter ID', 'Driving License', 'Passport');

CREATE TABLE guests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(150) NOT NULL,
    primary_phone VARCHAR(20) NOT NULL,
    alternate_phone VARCHAR(20),
    id_proof_type id_proof_enum NOT NULL,
    id_number VARCHAR(50) NOT NULL,
    vehicle_number VARCHAR(30),
    home_city VARCHAR(100) NOT NULL,
    home_state VARCHAR(100) NOT NULL,
    adults INTEGER NOT NULL DEFAULT 1 CHECK (adults >= 1),
    children INTEGER NOT NULL DEFAULT 0 CHECK (children >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. BOOKINGS TABLE
CREATE TYPE billing_cycle_enum AS ENUM ('24_HOUR_CYCLE', 'STANDARD_11AM');
CREATE TYPE booking_status_enum AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_number VARCHAR(50) NOT NULL UNIQUE,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
    guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE RESTRICT,
    tariff_per_day NUMERIC(10, 2) NOT NULL CHECK (tariff_per_day >= 0),
    billing_cycle_type billing_cycle_enum NOT NULL DEFAULT '24_HOUR_CYCLE',
    check_in_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expected_checkout_time TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_checkout_time TIMESTAMP WITH TIME ZONE,
    status booking_status_enum NOT NULL DEFAULT 'ACTIVE',
    gst_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    gst_rate NUMERIC(5, 2) DEFAULT 12.00,
    special_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. ROOM_CHARGES (Add-ons & Ancillary Services)
CREATE TABLE room_charges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    item_description VARCHAR(150) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    total_amount NUMERIC(10, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    added_by VARCHAR(100) NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. PAYMENTS (Ledger & Receipts)
CREATE TYPE payment_method_enum AS ENUM ('Cash', 'UPI', 'Card');
CREATE TYPE payment_type_enum AS ENUM ('ADVANCE', 'INTERMEDIATE', 'FINAL_SETTLEMENT');

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    payment_type payment_type_enum NOT NULL,
    payment_method payment_method_enum NOT NULL,
    reference_number VARCHAR(100),
    collected_by VARCHAR(100),
    notes TEXT,
    paid_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. CONVERSATION_LOGS (Interaction & Front Desk Thread)
CREATE TYPE interaction_category_enum AS ENUM (
    'Phone Call',
    'Room Service',
    'Extra Bed / Towel',
    'Complaint',
    'Front Desk Note'
);

CREATE TABLE conversation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE RESTRICT,
    category interaction_category_enum NOT NULL,
    staff_name VARCHAR(100) NOT NULL,
    summary TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Resolved', 'Logged')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- PERFORMANCE INDEXES
CREATE INDEX idx_rooms_status ON rooms(status);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_room_active ON bookings(room_id) WHERE status = 'ACTIVE';
CREATE INDEX idx_guests_phone ON guests(primary_phone);
CREATE INDEX idx_payments_paid_at ON payments(paid_at);
CREATE INDEX idx_conversation_logs_booking ON conversation_logs(booking_id);
`;

export const SQL_SCHEMA_SQLITE = `-- =========================================================================
-- SRI BHAVANI VASAVI BHAVAN - SQLite Production / Local Schema
-- =========================================================================

CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    room_number TEXT NOT NULL UNIQUE,
    floor INTEGER NOT NULL CHECK (floor IN (1, 2)),
    room_type TEXT NOT NULL CHECK (room_type IN ('AC', 'NON_AC')),
    bed_type TEXT NOT NULL DEFAULT 'Double Bed',
    base_rate REAL NOT NULL,
    max_occupancy INTEGER NOT NULL DEFAULT 2,
    status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'OCCUPIED', 'CLEANING_NEEDED', 'MAINTENANCE')),
    maintenance_reason TEXT,
    last_cleaned_at TEXT DEFAULT CURRENT_TIMESTAMP,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS guests (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    primary_phone TEXT NOT NULL,
    alternate_phone TEXT,
    id_proof_type TEXT NOT NULL CHECK (id_proof_type IN ('Aadhaar', 'Voter ID', 'Driving License', 'Passport')),
    id_number TEXT NOT NULL,
    vehicle_number TEXT,
    home_city TEXT NOT NULL,
    home_state TEXT NOT NULL,
    adults INTEGER NOT NULL DEFAULT 1,
    children INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    booking_number TEXT NOT NULL UNIQUE,
    room_id TEXT NOT NULL,
    guest_id TEXT NOT NULL,
    tariff_per_day REAL NOT NULL,
    billing_cycle_type TEXT NOT NULL DEFAULT '24_HOUR_CYCLE' CHECK (billing_cycle_type IN ('24_HOUR_CYCLE', 'STANDARD_11AM')),
    check_in_time TEXT NOT NULL,
    expected_checkout_time TEXT NOT NULL,
    actual_checkout_time TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'CANCELLED')),
    gst_enabled INTEGER NOT NULL DEFAULT 0,
    gst_rate REAL DEFAULT 12.0,
    special_notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id),
    FOREIGN KEY (guest_id) REFERENCES guests(id)
);

CREATE TABLE IF NOT EXISTS room_charges (
    id TEXT PRIMARY KEY,
    booking_id TEXT NOT NULL,
    item_description TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price REAL NOT NULL,
    total_amount REAL NOT NULL,
    added_by TEXT NOT NULL,
    added_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    booking_id TEXT NOT NULL,
    amount REAL NOT NULL,
    payment_type TEXT NOT NULL CHECK (payment_type IN ('ADVANCE', 'INTERMEDIATE', 'FINAL_SETTLEMENT')),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('Cash', 'UPI', 'Card')),
    reference_number TEXT,
    collected_by TEXT,
    notes TEXT,
    paid_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

CREATE TABLE IF NOT EXISTS conversation_logs (
    id TEXT PRIMARY KEY,
    booking_id TEXT NOT NULL,
    guest_id TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Phone Call', 'Room Service', 'Extra Bed / Towel', 'Complaint', 'Front Desk Note')),
    staff_name TEXT NOT NULL,
    summary TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Open',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id),
    FOREIGN KEY (guest_id) REFERENCES guests(id)
);
`;

export const BACKEND_API_SPECIFICATION = `
# Sri Bhavani Vasavi Bhavan PMS - REST API Specification

### Base URL: \`/api/v1\`

---

### 1. ROOM OPERATIONS

#### \`GET /api/v1/rooms\`
- **Description:** Retrieve all 11 rooms with current occupancy status, active booking summary, and cleaning status.
- **Query Params:** \`floor=1|2\`, \`type=AC|NON_AC\`, \`status=AVAILABLE|OCCUPIED|CLEANING_NEEDED|MAINTENANCE\`
- **Response:** \`200 OK\` -> Array of Room objects.

#### \`PATCH /api/v1/rooms/:id/status\`
- **Description:** Update room status (e.g. 1-click toggle from CLEANING_NEEDED to AVAILABLE, or put under MAINTENANCE).
- **Body:** \`{ "status": "AVAILABLE" | "MAINTENANCE", "reason"?: string }\`
- **Response:** \`200 OK\` -> Updated Room object.

---

### 2. CHECK-IN ENGINE

#### \`POST /api/v1/bookings/check-in\`
- **Description:** Process immediate guest check-in, create or link Guest record, allocate room, auto-stamp check-in timestamp, and log initial advance payment.
- **Request Body:**
\`\`\`json
{
  "roomId": "room-101",
  "guest": {
    "fullName": "K. Venkateswara Rao",
    "primaryPhone": "9845012389",
    "alternatePhone": "9845098712",
    "idProofType": "Aadhaar",
    "idNumber": "4829 3847 1029",
    "vehicleNumber": "KA-04-MB-4521",
    "homeCity": "Bengaluru",
    "homeState": "Karnataka",
    "adults": 2,
    "children": 1
  },
  "tariffPerDay": 1800,
  "billingCycleType": "24_HOUR_CYCLE",
  "checkInTime": "2026-09-08T18:00:00Z",
  "expectedCheckOutTime": "2026-09-09T18:00:00Z",
  "advancePayment": {
    "amount": 2000,
    "method": "UPI",
    "referenceNumber": "UPI/2619472910/SBI"
  },
  "notes": "Family visiting Arunachala"
}
\`\`\`
- **Database Transaction:**
  1. Verify room status is \`AVAILABLE\`.
  2. Insert Guest into \`guests\` table (or update if returning phone).
  3. Insert Booking record with status = \`ACTIVE\`.
  4. Update Room status to \`OCCUPIED\`.
  5. Insert Payment record with type = \`ADVANCE\`.
- **Response:** \`201 Created\` -> Complete Booking object.

---

### 3. CONVERSATION & INTERACTION TRACKER

#### \`POST /api/v1/bookings/:id/conversations\`
- **Description:** Add threaded front-desk note, phone log, or room service request to a guest profile.
- **Request Body:**
\`\`\`json
{
  "category": "Room Service" | "Phone Call" | "Extra Bed / Towel" | "Complaint" | "Front Desk Note",
  "staffName": "Ramesh (Day Desk)",
  "summary": "Guest requested 2 extra pillows and hot water flask.",
  "status": "Resolved"
}
\`\`\`
- **Response:** \`201 Created\` -> Created ConversationLog item.

#### \`PATCH /api/v1/conversations/:logId/resolve\`
- **Description:** Toggle status of an interaction from 'Open' to 'Resolved'.

---

### 4. ROOM ADD-ON CHARGES

#### \`POST /api/v1/bookings/:id/charges\`
- **Description:** Add an add-on charge (extra mattress, water bottle, beverage, laundry, etc.) to the booking folio.
- **Request Body:**
\`\`\`json
{
  "item": "Extra Mattress",
  "quantity": 1,
  "unitPrice": 300,
  "addedBy": "Ramesh"
}
\`\`\`
- **Response:** \`201 Created\` -> Created RoomCharge.

---

### 5. CHECK-OUT & BILLING ENGINE

#### \`GET /api/v1/bookings/:id/bill-summary\`
- **Description:** Compute live duration, automated tariff (24h vs 11 AM cycle), add-on charges, advance deduction, and final balance due.
- **Response:**
\`\`\`json
{
  "bookingNumber": "SBVB-2026-0101",
  "tariffPerDay": 1800,
  "daysStayed": 1,
  "roomRentTotal": 1800,
  "chargesTotal": 360,
  "subtotal": 2160,
  "gstAmount": 0,
  "grandTotal": 2160,
  "totalPaidAdvance": 2000,
  "balanceDue": 160
}
\`\`\`

#### \`POST /api/v1/bookings/:id/check-out\`
- **Description:** Finalize checkout: collect settlement balance, mark booking COMPLETED, transition room to CLEANING_NEEDED, and return printable folio.
- **Request Body:**
\`\`\`json
{
  "settlementPayment": {
    "amount": 160,
    "method": "Cash",
    "referenceNumber": "CASH-REC-101"
  },
  "gstEnabled": false
}
\`\`\`
- **Database Transaction:**
  1. Insert Payment record with type = \`FINAL_SETTLEMENT\`.
  2. Set Booking \`actual_checkout_time\` = now, status = \`COMPLETED\`.
  3. Update Room status = \`CLEANING_NEEDED\`.
- **Response:** \`200 OK\` -> Final Invoice & Booking object.

---

### 6. HOUSEKEEPING & DAILY LEDGER

#### \`GET /api/v1/reports/daily-ledger?date=YYYY-MM-DD\`
- **Description:** Get daily summary: total check-ins, check-outs, cash/UPI/card collections, and ledger transactions.
`;
