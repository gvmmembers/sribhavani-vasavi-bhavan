export type RoomType = 'AC' | 'NON_AC';

export type RoomStatus = 'AVAILABLE' | 'OCCUPIED' | 'CLEANING_NEEDED' | 'MAINTENANCE';

export type FloorName = 'Ground Floor' | 'First Floor';

export type IdProofType = 'Aadhaar' | 'Voter ID' | 'Driving License' | 'Passport';

export type BillingCycleType = '24_HOUR_CYCLE' | 'STANDARD_11AM';

export type PaymentMethod = 'Cash' | 'UPI' | 'Card';

export type PaymentType = 'ADVANCE' | 'INTERMEDIATE' | 'FINAL_SETTLEMENT';

export type InteractionCategory =
  | 'Phone Call'
  | 'Room Service'
  | 'Extra Bed / Towel'
  | 'Complaint'
  | 'Front Desk Note';

export interface Room {
  id: string;
  number: string;
  floor: FloorName;
  floorCode: 0 | 1; // 0 = Ground, 1 = First
  isAcEquipped: boolean; // all rooms have AC unit installed
  isAcActive: boolean; // toggle whether AC is ON or turned OFF for Non-AC guest
  bedType: 'Double Bed' | 'King Bed' | 'Triple Bed' | 'Family Room';
  maxOccupancy: number;
  status: RoomStatus;
  currentBookingId?: string | null;
  maintenanceReason?: string;
  lastCleanedAt?: string;
}

export interface Guest {
  id: string;
  fullName: string;
  primaryPhone: string;
  alternatePhone?: string;
  idProofType: IdProofType;
  idNumber: string;
  vehicleNumber?: string;
  homeCity: string;
  homeState: string;
  adults: number;
  children: number;
  createdAt: string;
}

export interface RoomCharge {
  id: string;
  bookingId: string;
  item: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  addedAt: string;
  addedBy: string;
}

export interface Payment {
  id: string;
  bookingId: string;
  guestName: string;
  roomNumber: string;
  amount: number;
  type: PaymentType;
  method: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
  paidAt: string;
}

export interface ConversationLog {
  id: string;
  bookingId: string;
  guestId: string;
  guestName: string;
  roomNumber: string;
  category: InteractionCategory;
  staffName: string;
  summary: string;
  status: 'Open' | 'Resolved' | 'Logged';
  timestamp: string;
}

export interface Booking {
  id: string;
  bookingNumber: string;
  roomId: string;
  roomNumber: string;
  floor: FloorName;
  isAcOpted: boolean; // true = AC turned on, false = Non-AC rate
  hasExtraBed?: boolean;
  extraBedCount?: number;
  guestId: string;
  guest: Guest;
  tariffPerDay: number; // custom demand rate entered at check-in
  billingCycleType: BillingCycleType;
  checkInTime: string; // ISO string
  expectedCheckOutTime: string; // ISO string
  actualCheckOutTime?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  charges: RoomCharge[];
  payments: Payment[];
  conversations: ConversationLog[];
  gstEnabled?: boolean;
  gstRate?: number;
  notes?: string;
  createdAt: string;
}

export interface BillCalculation {
  tariffPerDay: number;
  daysStayed: number;
  roomRentTotal: number;
  durationFormatted: string;
  extraBedTotal: number;
  chargesTotal: number;
  subtotal: number;
  gstAmount: number;
  grandTotal: number;
  totalPaidAdvance: number;
  balanceDue: number;
}

export interface DailyLedgerSummary {
  date: string;
  totalCheckIns: number;
  totalCheckOuts: number;
  totalCollections: number;
  cashCollections: number;
  upiCollections: number;
  cardCollections: number;
  activeOccupancyRate: number;
  transactions: Payment[];
}
