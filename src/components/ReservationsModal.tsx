import React, { useState } from 'react';
import { usePMS } from '../context/PMSContext';
import { Booking, BookingStatus } from '../types';
import { formatCurrency, formatDateTime, formatDateOnly, calculateBill } from '../utils/billing';
import {
  X,
  CalendarCheck,
  Search,
  LogIn,
  Edit,
  Trash2,
  Printer,
  Ban,
  Clock,
  User,
  Phone,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Plus,
  MapPin,
  IndianRupee,
  Bed,
} from 'lucide-react';

export const ReservationsModal: React.FC = () => {
  const {
    isReservationsModalOpen,
    setIsReservationsModalOpen,
    bookings,
    rooms,
    checkInReservation,
    cancelBooking,
    deleteBookingRecord,
    setEditingBooking,
    setInvoiceBooking,
    setCheckInRoom,
  } = usePMS();

  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'ALL'>('UPCOMING');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isReservationsModalOpen) return null;

  const now = Date.now();

  // Filter bookings by tab
  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'UPCOMING') {
      return b.status === 'RESERVED';
    }
    if (activeTab === 'ACTIVE') {
      return b.status === 'ACTIVE';
    }
    if (activeTab === 'COMPLETED') {
      return b.status === 'COMPLETED';
    }
    return true; // 'ALL'
  });

  // Apply search query
  const queryClean = searchQuery.trim().toLowerCase();
  const displayedBookings = filteredBookings.filter((b) => {
    if (!queryClean) return true;
    return (
      b.guest.fullName.toLowerCase().includes(queryClean) ||
      b.guest.primaryPhone.includes(queryClean) ||
      b.roomNumber.toLowerCase().includes(queryClean) ||
      b.bookingNumber.toLowerCase().includes(queryClean) ||
      b.guest.homeCity.toLowerCase().includes(queryClean) ||
      (b.notes && b.notes.toLowerCase().includes(queryClean))
    );
  });

  // Counts
  const counts = {
    upcoming: bookings.filter((b) => b.status === 'RESERVED').length,
    active: bookings.filter((b) => b.status === 'ACTIVE').length,
    completed: bookings.filter((b) => b.status === 'COMPLETED').length,
    all: bookings.length,
  };

  const handleCheckInGuest = (booking: Booking) => {
    const targetRoom = rooms.find((r) => r.id === booking.roomId);
    if (targetRoom && targetRoom.status === 'OCCUPIED' && targetRoom.currentBookingId !== booking.id) {
      alert(
        `Room ${booking.roomNumber} is currently occupied by another guest. Please ensure the previous guest has checked out first or change the room for this reservation.`
      );
      return;
    }

    const confirmCheckIn = window.confirm(
      `Confirm Check-In for ${booking.guest.fullName} in Room ${booking.roomNumber}?\n\nThis will mark the reservation as ACTIVE and set Room ${booking.roomNumber} to OCCUPIED.`
    );
    if (confirmCheckIn) {
      try {
        checkInReservation(booking.id);
      } catch (err: any) {
        alert(err.message || 'Failed to activate check-in.');
      }
    }
  };

  const handleCancel = (booking: Booking) => {
    const reason = window.prompt(
      `Are you sure you want to cancel the reservation for ${booking.guest.fullName} (Room ${booking.roomNumber})?\n\nEnter cancellation reason (optional):`,
      'Guest requested cancellation'
    );
    if (reason !== null) {
      cancelBooking(booking.id, reason);
    }
  };

  const handleDelete = (booking: Booking) => {
    const confirmDel = window.confirm(
      `Permanently delete booking record ${booking.bookingNumber} (${booking.guest.fullName})?\n\nThis action cannot be undone.`
    );
    if (confirmDel) {
      deleteBookingRecord(booking.id);
    }
  };

  const handleOpenNewReservation = () => {
    const freeRoom = rooms.find((r) => r.status === 'AVAILABLE') || rooms[0];
    setCheckInRoom(freeRoom);
  };

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'RESERVED':
        return {
          text: 'Future Reservation',
          style: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
        };
      case 'ACTIVE':
        return {
          text: 'Checked-In (In Stay)',
          style: 'bg-rose-100 text-rose-900 border-rose-300 font-bold',
        };
      case 'COMPLETED':
        return {
          text: 'Completed / Checked-Out',
          style: 'bg-stone-100 text-stone-700 border-stone-300 font-medium',
        };
      case 'CANCELLED':
        return {
          text: 'Cancelled',
          style: 'bg-rose-50 text-rose-700 border-rose-200 line-through',
        };
    }
  };

  const getStayCountdown = (checkInIso: string, status: BookingStatus) => {
    if (status !== 'RESERVED') return null;
    const diffMs = new Date(checkInIso).getTime() - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return { label: 'Arriving Today', urgent: true };
    if (diffDays === 1) return { label: 'Arriving Tomorrow', urgent: true };
    if (diffDays <= 7) return { label: `Arriving in ${diffDays} days`, urgent: false };
    return { label: `Arriving in ${diffDays} days`, urgent: false };
  };

  return (
    <div
      id="modal-reservations-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-xs overflow-y-auto"
      onClick={() => setIsReservationsModalOpen(false)}
    >
      <div
        id="modal-reservations-content"
        className="bg-white rounded-2xl max-w-5xl w-full border border-stone-200 shadow-2xl overflow-hidden my-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-600/30 text-amber-400 rounded-lg border border-amber-500/30">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">
                  Advance Reservations & Future Bookings
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {counts.upcoming} Upcoming
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Sri Bhavani Vasavi Bhavan • Front-Desk Reservation Desk
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-new-reservation-action"
              onClick={handleOpenNewReservation}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg shadow transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Booking</span>
            </button>

            <button
              onClick={() => setIsReservationsModalOpen(false)}
              className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="bg-stone-50 border-b border-stone-200 px-6 py-3 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('UPCOMING')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  activeTab === 'UPCOMING'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-100'
                }`}
              >
                Upcoming Reservations ({counts.upcoming})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ACTIVE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  activeTab === 'ACTIVE'
                    ? 'bg-rose-700 text-white shadow-xs'
                    : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-100'
                }`}
              >
                Active In-House ({counts.active})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('COMPLETED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  activeTab === 'COMPLETED'
                    ? 'bg-stone-800 text-white shadow-xs'
                    : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-100'
                }`}
              >
                Past Checked-Out ({counts.completed})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  activeTab === 'ALL'
                    ? 'bg-stone-900 text-amber-300 shadow-xs'
                    : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-100'
                }`}
              >
                All Records ({counts.all})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="search-reservations-input"
                type="text"
                placeholder="Search guest, mobile, room #, ref..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-stone-300 rounded-lg text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-xs"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[72vh] overflow-y-auto space-y-4 text-xs sm:text-sm">
          {displayedBookings.length === 0 ? (
            <div className="bg-stone-50 border border-dashed border-stone-300 rounded-2xl p-12 text-center text-stone-500">
              <CalendarCheck className="w-10 h-10 text-stone-400 mx-auto mb-3" />
              <p className="font-bold text-sm text-stone-800">
                {activeTab === 'UPCOMING'
                  ? 'No upcoming future reservations.'
                  : activeTab === 'ACTIVE'
                  ? 'No currently active stays.'
                  : 'No bookings found matching your search.'}
              </p>
              <p className="text-xs text-stone-400 mt-1 max-w-md mx-auto">
                {activeTab === 'UPCOMING'
                  ? 'Guests can book days, weeks, or months in advance. Click "+ New Booking" above to create an advance reservation.'
                  : 'Try clearing your search query or selecting a different tab.'}
              </p>
              {activeTab === 'UPCOMING' && (
                <button
                  onClick={handleOpenNewReservation}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Create First Advance Reservation
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {displayedBookings.map((b) => {
                const bill = calculateBill(b);
                const badge = getStatusBadge(b.status);
                const countdown = getStayCountdown(b.checkInTime, b.status);

                return (
                  <div
                    key={b.id}
                    id={`reservation-card-${b.bookingNumber}`}
                    className="bg-white border border-stone-200 rounded-xl p-4 hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    {/* Left Details */}
                    <div className="space-y-2 flex-1">
                      {/* Top Row: Room, Status, Reference */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-black text-stone-900">
                          Room {b.roomNumber}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded bg-stone-100 font-semibold text-stone-600 border border-stone-200">
                          {b.floor}
                        </span>
                        <span className={`text-[11px] px-2.5 py-0.5 rounded-full border ${badge.style}`}>
                          {badge.text}
                        </span>

                        {countdown && (
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                              countdown.urgent
                                ? 'bg-amber-500 text-white animate-pulse'
                                : 'bg-amber-100 text-amber-900 border border-amber-300'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            {countdown.label}
                          </span>
                        )}

                        <span className="text-[11px] text-stone-400 ml-auto font-mono">
                          Ref: {b.bookingNumber}
                        </span>
                      </div>

                      {/* Guest Details */}
                      <div className="flex items-center gap-3 text-xs text-stone-700 flex-wrap">
                        <span className="font-bold text-stone-900 flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-stone-500" />
                          {b.guest.fullName}
                        </span>
                        <span className="text-stone-300">•</span>
                        <a
                          href={`tel:${b.guest.primaryPhone}`}
                          className="text-amber-700 font-semibold hover:underline flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          {b.guest.primaryPhone}
                        </a>
                        <span className="text-stone-300">•</span>
                        <span className="flex items-center gap-1 text-stone-500">
                          <MapPin className="w-3 h-3" />
                          {b.guest.homeCity}, {b.guest.homeState}
                        </span>
                      </div>

                      {/* Dates: Reservation Created vs Stay Dates */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-stone-50 p-2.5 rounded-lg border border-stone-200 text-xs">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-stone-400 block">
                            Booking Created Date
                          </span>
                          <span className="font-semibold text-stone-700 mt-0.5 block">
                            {formatDateTime(b.createdAt)}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-bold text-amber-800 block">
                            Guest Check-In Stay Date
                          </span>
                          <span className="font-bold text-amber-950 mt-0.5 block">
                            {formatDateTime(b.checkInTime)}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-bold text-stone-400 block">
                            Scheduled Check-Out
                          </span>
                          <span className="font-semibold text-stone-700 mt-0.5 block">
                            {b.actualCheckOutTime
                              ? formatDateTime(b.actualCheckOutTime)
                              : formatDateTime(b.expectedCheckOutTime)}
                          </span>
                        </div>
                      </div>

                      {b.notes && (
                        <p className="text-[11px] text-stone-500 italic bg-amber-50/50 p-1.5 rounded border border-amber-100">
                          Note: {b.notes}
                        </p>
                      )}
                    </div>

                    {/* Right Financials & Action Buttons */}
                    <div className="flex flex-col justify-between items-end gap-3 border-t md:border-t-0 md:border-l border-stone-200 pt-3 md:pt-0 md:pl-4 min-w-[200px]">
                      {/* Financial Pill */}
                      <div className="text-right w-full">
                        <div className="text-xs text-stone-500">
                          Total Tariff: <strong className="text-stone-900">{formatCurrency(bill.grandTotal)}</strong>
                        </div>
                        <div className="text-xs text-emerald-700 font-semibold mt-0.5">
                          Advance Paid: {formatCurrency(bill.totalPaidAdvance)}
                        </div>
                        <div className="text-xs mt-0.5">
                          Balance Due:{' '}
                          <strong
                            className={`font-black ${
                              bill.balanceDue > 0 ? 'text-rose-700' : 'text-emerald-700'
                            }`}
                          >
                            {formatCurrency(bill.balanceDue)}
                          </strong>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {/* If RESERVED, show Check-In button */}
                        {b.status === 'RESERVED' && (
                          <button
                            id={`btn-checkin-reservation-${b.id}`}
                            type="button"
                            onClick={() => handleCheckInGuest(b)}
                            title="Guest arrived: Check in now and occupy room"
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                          >
                            <LogIn className="w-3.5 h-3.5" />
                            <span>Check-In Now</span>
                          </button>
                        )}

                        {/* Edit Button */}
                        {b.status !== 'CANCELLED' && b.status !== 'COMPLETED' && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsReservationsModalOpen(false);
                              setEditingBooking(b);
                            }}
                            title="Edit reservation dates, room, tariff, or guest particulars"
                            className="p-1.5 text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Print Folio / Receipt */}
                        <button
                          type="button"
                          onClick={() => setInvoiceBooking(b)}
                          title="Print official advance receipt or guest folio"
                          className="p-1.5 text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {/* Cancel Button */}
                        {b.status === 'RESERVED' && (
                          <button
                            type="button"
                            onClick={() => handleCancel(b)}
                            title="Cancel reservation"
                            className="p-1.5 text-stone-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Ban className="w-3.5 h-3.5 text-rose-500" />
                          </button>
                        )}

                        {/* Delete Record */}
                        <button
                          type="button"
                          onClick={() => handleDelete(b)}
                          title="Delete booking permanently"
                          className="p-1.5 text-stone-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
          <span>
            Sri Bhavani Vasavi Bhavan • Total 11 Rooms • Advance Reservations Synchronized Real-Time
          </span>
          <button
            onClick={() => setIsReservationsModalOpen(false)}
            className="px-4 py-1.5 bg-stone-900 text-white font-semibold rounded-lg hover:bg-stone-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
