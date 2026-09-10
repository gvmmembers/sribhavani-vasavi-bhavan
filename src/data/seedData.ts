import { Room, Booking, Payment } from '../types';

export const LODGE_DETAILS = {
  name: 'Sri Bhavani Vasavi Bhavan',
  tagline: 'Lodge & Pilgrimage Guest House',
  address:
    '85/32, Old Karkana Street, Backside Road, opp. Park Danish Mission Higher Secondary School, Tiruvannamalai, Tamil Nadu 606601',
  phone: '+91 94432 58190 / +91 4175 224501',
  email: 'reception@sribhavanivasavibhavan.com',
  gstin: '33AABCS1234F1Z5',
  checkInCycleDefault: '24_HOUR_CYCLE' as const,
  standardCheckOutHour: 11, // 11:00 AM
  extraBedRatePerDay: 150, // ₹150 / day for extra bed
};

/**
 * Total 11 Rooms in the stay:
 * - 6 rooms in Ground Floor: 101, 102, 103, 104, 105 (NON-AC), 111
 * - 5 rooms in First Floor: 106, 107, 108, 109 (NON-AC), 110 (NON-AC)
 *
 * AC rooms feature an instant toggle for reception to turn off AC when
 * a customer opts for Non-AC tariff.
 * Pricing is strictly demand-driven and entered custom per booking.
 */
export const INITIAL_ROOMS: Room[] = [
  // Ground Floor (6 Rooms)
  {
    id: 'room-g-101',
    number: '101',
    floor: 'Ground Floor',
    floorCode: 0,
    isAcEquipped: true,
    isAcActive: true,
    bedType: 'Double Bed',
    maxOccupancy: 3,
    status: 'AVAILABLE',
  },
  {
    id: 'room-g-102',
    number: '102',
    floor: 'Ground Floor',
    floorCode: 0,
    isAcEquipped: true,
    isAcActive: true,
    bedType: 'Double Bed',
    maxOccupancy: 3,
    status: 'AVAILABLE',
  },
  {
    id: 'room-g-103',
    number: '103',
    floor: 'Ground Floor',
    floorCode: 0,
    isAcEquipped: true,
    isAcActive: true,
    bedType: 'Double Bed',
    maxOccupancy: 3,
    status: 'AVAILABLE',
  },
  {
    id: 'room-g-104',
    number: '104',
    floor: 'Ground Floor',
    floorCode: 0,
    isAcEquipped: true,
    isAcActive: true,
    bedType: 'Double Bed',
    maxOccupancy: 3,
    status: 'AVAILABLE',
  },
  {
    id: 'room-g-105',
    number: '105',
    floor: 'Ground Floor',
    floorCode: 0,
    isAcEquipped: false,
    isAcActive: false,
    bedType: 'Double Bed',
    maxOccupancy: 3,
    status: 'AVAILABLE',
  },
  {
    id: 'room-g-111',
    number: '111',
    floor: 'Ground Floor',
    floorCode: 0,
    isAcEquipped: true,
    isAcActive: true,
    bedType: 'Triple Bed',
    maxOccupancy: 4,
    status: 'AVAILABLE',
  },

  // First Floor (5 Rooms)
  {
    id: 'room-f-106',
    number: '106',
    floor: 'First Floor',
    floorCode: 1,
    isAcEquipped: true,
    isAcActive: true,
    bedType: 'Triple Bed',
    maxOccupancy: 4,
    status: 'AVAILABLE',
  },
  {
    id: 'room-f-107',
    number: '107',
    floor: 'First Floor',
    floorCode: 1,
    isAcEquipped: true,
    isAcActive: true,
    bedType: 'Double Bed',
    maxOccupancy: 3,
    status: 'AVAILABLE',
  },
  {
    id: 'room-f-108',
    number: '108',
    floor: 'First Floor',
    floorCode: 1,
    isAcEquipped: true,
    isAcActive: true,
    bedType: 'Double Bed',
    maxOccupancy: 3,
    status: 'AVAILABLE',
  },
  {
    id: 'room-f-109',
    number: '109',
    floor: 'First Floor',
    floorCode: 1,
    isAcEquipped: false,
    isAcActive: false,
    bedType: 'Double Bed',
    maxOccupancy: 3,
    status: 'AVAILABLE',
  },
  {
    id: 'room-f-110',
    number: '110',
    floor: 'First Floor',
    floorCode: 1,
    isAcEquipped: false,
    isAcActive: false,
    bedType: 'King Bed',
    maxOccupancy: 4,
    status: 'AVAILABLE',
  },
];

/**
 * Clean slate with NO random data in daily ledger.
 * Clean, fresh ledger ready for real operations.
 */
export const INITIAL_BOOKINGS: Booking[] = [];

export const INITIAL_PAST_PAYMENTS: Payment[] = [];
