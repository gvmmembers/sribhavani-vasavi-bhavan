import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  Room,
  Booking,
  Payment,
  ConversationLog,
  RoomCharge,
  Guest,
  RoomStatus,
  PaymentMethod,
  BillingCycleType,
  FloorName,
} from '../types';
import { INITIAL_ROOMS, INITIAL_BOOKINGS, INITIAL_PAST_PAYMENTS } from '../data/seedData';

interface PMSContextType {
  rooms: Room[];
  bookings: Booking[];
  pastPayments: Payment[];
  selectedFloor: 'all' | FloorName;
  selectedAcMode: 'all' | 'AC_ON' | 'AC_OFF';
  selectedStatus: 'all' | RoomStatus;
  searchQuery: string;
  setSelectedFloor: (floor: 'all' | FloorName) => void;
  setSelectedAcMode: (mode: 'all' | 'AC_ON' | 'AC_OFF') => void;
  setSelectedStatus: (status: 'all' | RoomStatus) => void;
  setSearchQuery: (q: string) => void;

  // Multi-device sync state
  isSynced: boolean;
  lastSyncTime: Date | null;
  syncNow: () => Promise<void>;

  // Active Modals
  checkInRoom: Room | null;
  setCheckInRoom: (room: Room | null) => void;
  viewingRoom: Room | null;
  setViewingRoom: (room: Room | null) => void;
  checkOutBooking: Booking | null;
  setCheckOutBooking: (booking: Booking | null) => void;
  invoiceBooking: Booking | null;
  setInvoiceBooking: (booking: Booking | null) => void;
  blockRoomTarget: Room | null;
  setBlockRoomTarget: (room: Room | null) => void;
  isDailyLedgerOpen: boolean;
  setIsDailyLedgerOpen: (open: boolean) => void;
  isBlueprintOpen: boolean;
  setIsBlueprintOpen: (open: boolean) => void;

  // Operational Actions
  toggleRoomAc: (roomId: string) => void;
  blockRoom: (roomId: string, reason: string) => void;
  unblockRoom: (roomId: string) => void;
  markRoomCleaned: (roomId: string) => void;

  checkIn: (params: {
    roomId: string;
    guest: Omit<Guest, 'id' | 'createdAt'>;
    tariffPerDay: number;
    billingCycleType: BillingCycleType;
    isAcOpted: boolean;
    hasExtraBed?: boolean;
    extraBedCount?: number;
    checkInTime: string;
    expectedCheckOutTime: string;
    advancePayment: {
      amount: number;
      method: PaymentMethod;
      referenceNumber?: string;
    };
    initialNote?: string;
  }) => Booking;

  addConversationLog: (
    bookingId: string,
    log: Omit<ConversationLog, 'id' | 'bookingId' | 'guestId' | 'guestName' | 'roomNumber' | 'timestamp'>
  ) => void;

  addRoomCharge: (
    bookingId: string,
    charge: Omit<RoomCharge, 'id' | 'bookingId' | 'totalAmount' | 'addedAt'>
  ) => void;

  removeRoomCharge: (bookingId: string, chargeId: string) => void;

  checkOut: (params: {
    bookingId: string;
    settlementAmount: number;
    paymentMethod: PaymentMethod;
    referenceNumber?: string;
    gstEnabled: boolean;
  }) => Booking;

  getActiveBookingForRoom: (roomId: string) => Booking | undefined;
  deletePayment: (paymentId: string) => void;
  deleteBookingRecord: (bookingId: string) => void;
  resetToSampleData: () => Promise<void>;
  clearLedgerData: () => Promise<void>;
}

const PMSContext = createContext<PMSContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_ROOMS = 'sbvb_pms_rooms_v5';
const LOCAL_STORAGE_KEY_BOOKINGS = 'sbvb_pms_bookings_v5';
const LOCAL_STORAGE_KEY_PAYMENTS = 'sbvb_pms_payments_v5';

export const PMSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rooms, setRooms] = useState<Room[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_ROOMS);
      return saved ? JSON.parse(saved) : INITIAL_ROOMS;
    } catch {
      return INITIAL_ROOMS;
    }
  });

  const [bookings, setBookings] = useState<Booking[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_BOOKINGS);
      return saved ? JSON.parse(saved) : INITIAL_BOOKINGS;
    } catch {
      return INITIAL_BOOKINGS;
    }
  });

  const [pastPayments, setPastPayments] = useState<Payment[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_PAYMENTS);
      return saved ? JSON.parse(saved) : INITIAL_PAST_PAYMENTS;
    } catch {
      return INITIAL_PAST_PAYMENTS;
    }
  });

  // Sync state tracking
  const [isSynced, setIsSynced] = useState<boolean>(true);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(new Date());
  const serverVersionRef = useRef<number>(0);

  // Filter & Search states
  const [selectedFloor, setSelectedFloor] = useState<'all' | FloorName>('all');
  const [selectedAcMode, setSelectedAcMode] = useState<'all' | 'AC_ON' | 'AC_OFF'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | RoomStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal dialog states
  const [checkInRoom, setCheckInRoom] = useState<Room | null>(null);
  const [viewingRoom, setViewingRoom] = useState<Room | null>(null);
  const [checkOutBooking, setCheckOutBooking] = useState<Booking | null>(null);
  const [invoiceBooking, setInvoiceBooking] = useState<Booking | null>(null);
  const [blockRoomTarget, setBlockRoomTarget] = useState<Room | null>(null);
  const [isDailyLedgerOpen, setIsDailyLedgerOpen] = useState(false);
  const [isBlueprintOpen, setIsBlueprintOpen] = useState(false);

  // Save to local storage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_ROOMS, JSON.stringify(rooms));
    } catch (e) {
      console.error('Failed to save rooms to localStorage', e);
    }
  }, [rooms]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_BOOKINGS, JSON.stringify(bookings));
    } catch (e) {
      console.error('Failed to save bookings to localStorage', e);
    }
  }, [bookings]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_PAYMENTS, JSON.stringify(pastPayments));
    } catch (e) {
      console.error('Failed to save payments to localStorage', e);
    }
  }, [pastPayments]);

  // Push local updates to server (so all other devices immediately sync)
  const syncWithServer = useCallback(
    async (newRooms: Room[], newBookings: Booking[], newPayments: Payment[]) => {
      try {
        const res = await fetch('/api/pms/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rooms: newRooms,
            bookings: newBookings,
            pastPayments: newPayments,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.version) {
            serverVersionRef.current = data.version;
          }
          setIsSynced(true);
          setLastSyncTime(new Date());
        } else {
          setIsSynced(false);
        }
      } catch (err) {
        console.warn('[PMS Sync] Could not reach server for real-time broadcast:', err);
        setIsSynced(false);
      }
    },
    []
  );

  // Manual or initial pull from server
  const fetchStateFromServer = useCallback(async () => {
    try {
      const res = await fetch('/api/pms/state', {
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data && Array.isArray(data.rooms)) {
        if (data.version && data.version <= serverVersionRef.current) {
          // No newer changes
          return;
        }
        if (data.version) {
          serverVersionRef.current = data.version;
        }

        setRooms(data.rooms);
        setBookings(Array.isArray(data.bookings) ? data.bookings : []);
        setPastPayments(Array.isArray(data.pastPayments) ? data.pastPayments : []);
        setIsSynced(true);
        setLastSyncTime(new Date());
      }
    } catch (err) {
      console.warn('[PMS Fetch] Offline or waiting for server startup...', err);
    }
  }, []);

  // Multi-device synchronization: Fetch on mount, listen to SSE stream, and poll fallback
  useEffect(() => {
    // 1. Initial fetch from server
    fetchStateFromServer();

    // 2. Server-Sent Events stream for instant push from other devices
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/pms/stream');

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'STATE_CHANGED' || payload.type === 'INIT') {
            const data = payload.data;
            if (data && Array.isArray(data.rooms)) {
              if (data.version && data.version <= serverVersionRef.current) {
                return;
              }
              if (data.version) {
                serverVersionRef.current = data.version;
              }

              setRooms(data.rooms);
              setBookings(Array.isArray(data.bookings) ? data.bookings : []);
              setPastPayments(Array.isArray(data.pastPayments) ? data.pastPayments : []);
              setIsSynced(true);
              setLastSyncTime(new Date());
            }
          }
        } catch {
          // Non-JSON or heartbeat
        }
      };

      eventSource.onerror = () => {
        // EventSource will auto-retry
        setIsSynced(false);
      };

      eventSource.onopen = () => {
        setIsSynced(true);
      };
    } catch (err) {
      console.warn('[PMS SSE] SSE setup error:', err);
    }

    // 3. Periodic fallback poll every 3 seconds for rock-solid cross-device sync
    const pollInterval = setInterval(() => {
      fetchStateFromServer();
    }, 3000);

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      clearInterval(pollInterval);
    };
  }, [fetchStateFromServer]);

  const getActiveBookingForRoom = (roomId: string): Booking | undefined => {
    return bookings.find((b) => b.roomId === roomId && b.status === 'ACTIVE');
  };

  /**
   * Toggle AC ON / OFF for any room.
   */
  const toggleRoomAc = (roomId: string) => {
    const updated = rooms.map((r) => {
      if (r.id !== roomId) return r;
      return {
        ...r,
        isAcActive: !r.isAcActive,
      };
    });
    setRooms(updated);
    syncWithServer(updated, bookings, pastPayments);
  };

  /**
   * Block room for maintenance with selected reason
   */
  const blockRoom = (roomId: string, reason: string) => {
    const updated = rooms.map((r) => {
      if (r.id !== roomId) return r;
      return {
        ...r,
        status: 'MAINTENANCE' as RoomStatus,
        maintenanceReason: reason || 'Under maintenance / repair',
      };
    });
    setRooms(updated);
    setBlockRoomTarget(null);
    syncWithServer(updated, bookings, pastPayments);
  };

  /**
   * Unblock room and return directly to AVAILABLE
   */
  const unblockRoom = (roomId: string) => {
    const updated = rooms.map((r) => {
      if (r.id !== roomId) return r;
      return {
        ...r,
        status: 'AVAILABLE' as RoomStatus,
        maintenanceReason: undefined,
        lastCleanedAt: new Date().toISOString(),
      };
    });
    setRooms(updated);
    setBlockRoomTarget(null);
    syncWithServer(updated, bookings, pastPayments);
  };

  /**
   * Mark cleaning completed
   */
  const markRoomCleaned = (roomId: string) => {
    const updated = rooms.map((r) =>
      r.id === roomId
        ? {
            ...r,
            status: 'AVAILABLE' as RoomStatus,
            maintenanceReason: undefined,
            lastCleanedAt: new Date().toISOString(),
          }
        : r
    );
    setRooms(updated);
    syncWithServer(updated, bookings, pastPayments);
  };

  /**
   * Fast Check-in (Immediately persisted & synced to all devices)
   */
  const checkIn = ({
    roomId,
    guest,
    tariffPerDay,
    billingCycleType,
    isAcOpted,
    hasExtraBed,
    extraBedCount,
    checkInTime,
    expectedCheckOutTime,
    advancePayment,
    initialNote,
  }: {
    roomId: string;
    guest: Omit<Guest, 'id' | 'createdAt'>;
    tariffPerDay: number;
    billingCycleType: BillingCycleType;
    isAcOpted: boolean;
    hasExtraBed?: boolean;
    extraBedCount?: number;
    checkInTime: string;
    expectedCheckOutTime: string;
    advancePayment: {
      amount: number;
      method: PaymentMethod;
      referenceNumber?: string;
    };
    initialNote?: string;
  }): Booking => {
    const room = rooms.find((r) => r.id === roomId);
    if (!room) throw new Error('Room not found');

    const guestId = `gst-${Date.now()}`;
    const bookingId = `bk-${room.number}-${Date.now().toString().slice(-4)}`;
    const bookingNumber = `SBVB-${new Date().getFullYear()}-${room.number}${Date.now().toString().slice(-3)}`;

    const fullGuest: Guest = {
      ...guest,
      id: guestId,
      createdAt: new Date().toISOString(),
    };

    const initialPaymentsList: Payment[] = [];
    if (advancePayment.amount > 0) {
      initialPaymentsList.push({
        id: `pay-${Date.now()}`,
        bookingId,
        guestName: guest.fullName,
        roomNumber: room.number,
        amount: advancePayment.amount,
        type: 'ADVANCE',
        method: advancePayment.method,
        referenceNumber: advancePayment.referenceNumber || `REC-${Date.now().toString().slice(-4)}`,
        notes: 'Initial advance collected at check-in',
        paidAt: checkInTime,
      });
    }

    const conversations: ConversationLog[] = [];
    if (initialNote && initialNote.trim()) {
      conversations.push({
        id: `cnv-${Date.now()}`,
        bookingId,
        guestId,
        guestName: guest.fullName,
        roomNumber: room.number,
        category: 'Front Desk Note',
        staffName: 'Reception',
        summary: initialNote.trim(),
        status: 'Logged',
        timestamp: checkInTime,
      });
    }

    const newBooking: Booking = {
      id: bookingId,
      bookingNumber,
      roomId,
      roomNumber: room.number,
      floor: room.floor,
      isAcOpted,
      hasExtraBed: !!hasExtraBed,
      extraBedCount: hasExtraBed ? (extraBedCount || 1) : 0,
      guestId,
      guest: fullGuest,
      tariffPerDay,
      billingCycleType,
      checkInTime,
      expectedCheckOutTime,
      status: 'ACTIVE',
      charges: [],
      payments: initialPaymentsList,
      conversations,
      gstEnabled: false,
      createdAt: new Date().toISOString(),
    };

    // Update rooms: mark OCCUPIED and sync AC active state with guest choice
    const updatedRooms = rooms.map((r) =>
      r.id === roomId
        ? {
            ...r,
            status: 'OCCUPIED' as RoomStatus,
            isAcActive: isAcOpted,
            currentBookingId: bookingId,
          }
        : r
    );

    const updatedBookings = [newBooking, ...bookings];

    setRooms(updatedRooms);
    setBookings(updatedBookings);

    // Sync to backend immediately for multi-device cross-access
    syncWithServer(updatedRooms, updatedBookings, pastPayments);

    return newBooking;
  };

  const addConversationLog = (
    bookingId: string,
    log: Omit<ConversationLog, 'id' | 'bookingId' | 'guestId' | 'guestName' | 'roomNumber' | 'timestamp'>
  ) => {
    const updatedBookings = bookings.map((b) => {
      if (b.id !== bookingId) return b;
      const newLog: ConversationLog = {
        id: `cnv-${Date.now()}`,
        bookingId: b.id,
        guestId: b.guestId,
        guestName: b.guest.fullName,
        roomNumber: b.roomNumber,
        category: log.category,
        staffName: log.staffName,
        summary: log.summary,
        status: log.status,
        timestamp: new Date().toISOString(),
      };
      return {
        ...b,
        conversations: [newLog, ...b.conversations],
      };
    });

    setBookings(updatedBookings);
    syncWithServer(rooms, updatedBookings, pastPayments);
  };

  const addRoomCharge = (
    bookingId: string,
    charge: Omit<RoomCharge, 'id' | 'bookingId' | 'totalAmount' | 'addedAt'>
  ) => {
    const totalAmount = charge.quantity * charge.unitPrice;
    const updatedBookings = bookings.map((b) => {
      if (b.id !== bookingId) return b;
      const newCharge: RoomCharge = {
        id: `chg-${Date.now()}`,
        bookingId: b.id,
        item: charge.item,
        quantity: charge.quantity,
        unitPrice: charge.unitPrice,
        totalAmount,
        addedBy: charge.addedBy,
        addedAt: new Date().toISOString(),
      };
      return {
        ...b,
        charges: [...(b.charges || []), newCharge],
      };
    });

    setBookings(updatedBookings);
    syncWithServer(rooms, updatedBookings, pastPayments);
  };

  const removeRoomCharge = (bookingId: string, chargeId: string) => {
    const updatedBookings = bookings.map((b) => {
      if (b.id !== bookingId) return b;
      return {
        ...b,
        charges: (b.charges || []).filter((c) => c.id !== chargeId),
      };
    });

    setBookings(updatedBookings);
    syncWithServer(rooms, updatedBookings, pastPayments);
  };

  const checkOut = ({
    bookingId,
    settlementAmount,
    paymentMethod,
    referenceNumber,
    gstEnabled,
  }: {
    bookingId: string;
    settlementAmount: number;
    paymentMethod: PaymentMethod;
    referenceNumber?: string;
    gstEnabled: boolean;
  }): Booking => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) throw new Error('Booking not found');

    const checkOutTimestamp = new Date().toISOString();
    const updatedPayments = [...(booking.payments || [])];

    if (settlementAmount > 0) {
      const settlementPayment: Payment = {
        id: `pay-settle-${Date.now()}`,
        bookingId: booking.id,
        guestName: booking.guest.fullName,
        roomNumber: booking.roomNumber,
        amount: settlementAmount,
        type: 'FINAL_SETTLEMENT',
        method: paymentMethod,
        referenceNumber: referenceNumber || `SETTLE-${Date.now().toString().slice(-4)}`,
        notes: 'Final settlement collected at check-out',
        paidAt: checkOutTimestamp,
      };
      updatedPayments.push(settlementPayment);
    }

    const updatedBooking: Booking = {
      ...booking,
      actualCheckOutTime: checkOutTimestamp,
      status: 'COMPLETED',
      payments: updatedPayments,
      gstEnabled,
    };

    // Update bookings
    const updatedBookings = bookings.map((b) => (b.id === bookingId ? updatedBooking : b));

    // Transition room to CLEANING_NEEDED
    const updatedRooms = rooms.map((r) =>
      r.id === booking.roomId
        ? {
            ...r,
            status: 'CLEANING_NEEDED' as RoomStatus,
            currentBookingId: null,
          }
        : r
    );

    setBookings(updatedBookings);
    setRooms(updatedRooms);

    // Sync to server so all devices see the check-out & updated billing
    syncWithServer(updatedRooms, updatedBookings, pastPayments);

    return updatedBooking;
  };

  /**
   * Delete an individual payment ledger detail
   */
  const deletePayment = (paymentId: string) => {
    const updatedPastPayments = pastPayments.filter((p) => p.id !== paymentId);
    const updatedBookings = bookings.map((b) => {
      if (!b.payments || !b.payments.some((p) => p.id === paymentId)) {
        return b;
      }
      return {
        ...b,
        payments: b.payments.filter((p) => p.id !== paymentId),
      };
    });

    setPastPayments(updatedPastPayments);
    setBookings(updatedBookings);
    syncWithServer(rooms, updatedBookings, updatedPastPayments);
  };

  /**
   * Delete an individual booking ledger detail
   */
  const deleteBookingRecord = (bookingId: string) => {
    const targetBooking = bookings.find((b) => b.id === bookingId);
    const updatedBookings = bookings.filter((b) => b.id !== bookingId);

    // If the booking was currently active on a room, restore room to AVAILABLE
    const updatedRooms = rooms.map((r) => {
      if (targetBooking && r.id === targetBooking.roomId && r.currentBookingId === bookingId) {
        return {
          ...r,
          status: 'AVAILABLE' as RoomStatus,
          currentBookingId: null,
        };
      }
      return r;
    });

    setBookings(updatedBookings);
    setRooms(updatedRooms);
    syncWithServer(updatedRooms, updatedBookings, pastPayments);
  };

  const resetToSampleData = async () => {
    try {
      const res = await fetch('/api/pms/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'Gvminfotech!@#@14356789' }),
      });
      if (res.ok) {
        const json = await res.json();
        setRooms(json.data.rooms);
        setBookings(json.data.bookings);
        setPastPayments(json.data.pastPayments);
        return;
      }
    } catch {
      // fallback local
    }
    setRooms(INITIAL_ROOMS);
    setBookings(INITIAL_BOOKINGS);
    setPastPayments(INITIAL_PAST_PAYMENTS);
  };

  const clearLedgerData = async () => {
    try {
      const res = await fetch('/api/pms/clear-ledger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'Gvminfotech!@#@14356789' }),
      });
      if (res.ok) {
        const json = await res.json();
        setRooms(json.data.rooms);
        setBookings(json.data.bookings);
        setPastPayments(json.data.pastPayments);
        return;
      }
    } catch {
      // fallback local
    }
    setBookings([]);
    setPastPayments([]);
    setRooms((prev) =>
      prev.map((r) => ({
        ...r,
        status: 'AVAILABLE',
        currentBookingId: null,
        maintenanceReason: undefined,
      }))
    );
  };

  return (
    <PMSContext.Provider
      value={{
        rooms,
        bookings,
        pastPayments,
        selectedFloor,
        selectedAcMode,
        selectedStatus,
        searchQuery,
        setSelectedFloor,
        setSelectedAcMode,
        setSelectedStatus,
        setSearchQuery,
        isSynced,
        lastSyncTime,
        syncNow: fetchStateFromServer,
        checkInRoom,
        setCheckInRoom,
        viewingRoom,
        setViewingRoom,
        checkOutBooking,
        setCheckOutBooking,
        invoiceBooking,
        setInvoiceBooking,
        blockRoomTarget,
        setBlockRoomTarget,
        isDailyLedgerOpen,
        setIsDailyLedgerOpen,
        isBlueprintOpen,
        setIsBlueprintOpen,
        toggleRoomAc,
        blockRoom,
        unblockRoom,
        markRoomCleaned,
        checkIn,
        addConversationLog,
        addRoomCharge,
        removeRoomCharge,
        checkOut,
        getActiveBookingForRoom,
        deletePayment,
        deleteBookingRecord,
        resetToSampleData,
        clearLedgerData,
      }}
    >
      {children}
    </PMSContext.Provider>
  );
};

export const usePMS = () => {
  const context = useContext(PMSContext);
  if (!context) {
    throw new Error('usePMS must be used within a PMSProvider');
  }
  return context;
};
