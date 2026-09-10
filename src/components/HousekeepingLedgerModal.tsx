import React, { useState } from 'react';
import { usePMS } from '../context/PMSContext';
import { LODGE_DETAILS } from '../data/seedData';
import { formatCurrency, formatDateTime } from '../utils/billing';
import {
  X,
  Sparkles,
  Receipt,
  CheckCircle2,
  Calendar,
  Download,
  Printer,
  Wrench,
  Trash2,
  AlertCircle,
  Users,
  Lock,
  Search,
} from 'lucide-react';
import { Payment } from '../types';
import { AdminResetModal } from './AdminResetModal';

export const HousekeepingLedgerModal: React.FC = () => {
  const {
    isDailyLedgerOpen,
    setIsDailyLedgerOpen,
    rooms,
    bookings,
    pastPayments,
    markRoomCleaned,
    unblockRoom,
    clearLedgerData,
    deletePayment,
    deleteBookingRecord,
    setBlockRoomTarget,
  } = usePMS();

  const [activeTab, setActiveTab] = useState<'ledger' | 'housekeeping'>('ledger');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [filterScope, setFilterScope] = useState<'DATE' | 'MONTH' | 'ALL'>('DATE');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLedgerResetAuthOpen, setIsLedgerResetAuthOpen] = useState(false);

  if (!isDailyLedgerOpen) return null;

  // Gather all payments from active and completed bookings + past payments
  const allPayments: Payment[] = [];

  bookings.forEach((b) => {
    (b.payments || []).forEach((p) => {
      allPayments.push(p);
    });
  });

  pastPayments.forEach((p) => {
    if (!allPayments.some((existing) => existing.id === p.id)) {
      allPayments.push(p);
    }
  });

  // Sort by date descending
  allPayments.sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());

  // Filter payments by scope & search
  const paymentsByScope = allPayments.filter((p) => {
    if (filterScope === 'ALL') return true;
    if (filterScope === 'MONTH') {
      const targetMonth = selectedDate.slice(0, 7);
      return p.paidAt.startsWith(targetMonth);
    }
    // Default 'DATE'
    return p.paidAt.startsWith(selectedDate);
  });

  const queryClean = searchQuery.trim().toLowerCase();
  const displayedPayments = paymentsByScope.filter((p) => {
    if (!queryClean) return true;
    return (
      p.guestName.toLowerCase().includes(queryClean) ||
      p.roomNumber.toLowerCase().includes(queryClean) ||
      (p.referenceNumber && p.referenceNumber.toLowerCase().includes(queryClean)) ||
      (p.notes && p.notes.toLowerCase().includes(queryClean)) ||
      p.method.toLowerCase().includes(queryClean)
    );
  });

  // Filter bookings by scope and search
  const displayedBookings = bookings.filter((b) => {
    if (filterScope === 'DATE') {
      const matchIn = b.checkInTime.startsWith(selectedDate);
      const matchOut = b.actualCheckOutTime ? b.actualCheckOutTime.startsWith(selectedDate) : false;
      if (!matchIn && !matchOut && b.status !== 'CHECKED_IN') return false;
    } else if (filterScope === 'MONTH') {
      const targetMonth = selectedDate.slice(0, 7);
      const matchIn = b.checkInTime.startsWith(targetMonth);
      const matchOut = b.actualCheckOutTime ? b.actualCheckOutTime.startsWith(targetMonth) : false;
      if (!matchIn && !matchOut && b.status !== 'CHECKED_IN') return false;
    }

    if (!queryClean) return true;
    return (
      b.guest.fullName.toLowerCase().includes(queryClean) ||
      b.guest.phone.toLowerCase().includes(queryClean) ||
      b.roomNumber.toLowerCase().includes(queryClean) ||
      (b.notes && b.notes.toLowerCase().includes(queryClean))
    );
  });

  const totalCollected = displayedPayments.reduce((sum, p) => sum + p.amount, 0);
  const cashCollected = displayedPayments
    .filter((p) => p.method === 'Cash')
    .reduce((sum, p) => sum + p.amount, 0);
  const upiCollected = displayedPayments
    .filter((p) => p.method === 'UPI')
    .reduce((sum, p) => sum + p.amount, 0);
  const cardCollected = displayedPayments
    .filter((p) => p.method === 'Card')
    .reduce((sum, p) => sum + p.amount, 0);

  const cleaningRooms = rooms.filter((r) => r.status === 'CLEANING_NEEDED');
  const maintenanceRooms = rooms.filter((r) => r.status === 'MAINTENANCE');

  const exportCSV = (scope: 'CURRENT' | 'ALL' = 'CURRENT') => {
    const listToExport = scope === 'ALL' ? allPayments : displayedPayments;
    const headers = ['Date', 'ReceiptRef', 'Room', 'Guest', 'Type', 'Method', 'Amount', 'Notes'];
    const rows = listToExport.map((p) => [
      formatDateTime(p.paidAt),
      p.referenceNumber || p.id,
      p.roomNumber,
      `"${p.guestName}"`,
      p.type,
      p.method,
      p.amount,
      `"${p.notes || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const filenameLabel =
      scope === 'ALL'
        ? 'Entire_Database_Ledger_All_Time'
        : filterScope === 'MONTH'
        ? `Monthly_Ledger_${selectedDate.slice(0, 7)}`
        : filterScope === 'ALL'
        ? 'All_Time_Ledger'
        : `Daily_Ledger_${selectedDate}`;
    link.setAttribute('download', `${filenameLabel}_SBVB.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeletePaymentItem = (p: Payment) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete this payment record?\n\n• Room: ${p.roomNumber}\n• Guest: ${p.guestName}\n• Amount: ₹${p.amount}\n• Payment Mode: ${p.method}\n• Date: ${formatDateTime(p.paidAt)}\n\nThis will remove it from the ledger immediately.`
    );
    if (confirmDelete) {
      deletePayment(p.id);
    }
  };

  const handleDeleteBookingItem = (bookingId: string, roomNumber: string, guestName: string) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the stay record for Room ${roomNumber} (${guestName})?\n\nIf this room is currently occupied, deleting this record will also mark the room as Available.`
    );
    if (confirmDelete) {
      deleteBookingRecord(bookingId);
    }
  };

  return (
    <div
      id="modal-ledger-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-xs overflow-y-auto"
      onClick={() => setIsDailyLedgerOpen(false)}
    >
      <div
        id="modal-ledger-content"
        className="bg-white rounded-2xl max-w-4xl w-full border border-stone-200 shadow-2xl overflow-hidden my-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-600/30 text-amber-400 rounded-lg border border-amber-500/30">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Daily Ledger & Housekeeping Management</h2>
              <p className="text-xs text-stone-400">
                {LODGE_DETAILS.name} • Tiruvannamalai
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsDailyLedgerOpen(false)}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-stone-200 px-6 bg-stone-50 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('ledger')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'ledger'
                ? 'border-amber-600 text-amber-900 bg-white'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Receipt className="w-4 h-4 text-stone-500" />
            Daily Cash & Collections Ledger ({displayedPayments.length})
          </button>
          <button
            onClick={() => setActiveTab('housekeeping')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'housekeeping'
                ? 'border-amber-600 text-amber-900 bg-white'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-stone-500" />
            Housekeeping Turnaround ({cleaningRooms.length} Rooms Pending)
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6 text-xs sm:text-sm">
          {/* TAB 1: LEDGER */}
          {activeTab === 'ledger' && (
            <div className="space-y-6">
              {/* Date Filter & Export Bar */}
              <div className="space-y-3 bg-stone-50 p-4 rounded-xl border border-stone-200">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  {/* Scope Selector Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-stone-700 mr-1">View Period:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDate(new Date().toISOString().slice(0, 10));
                        setFilterScope('DATE');
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                        filterScope === 'DATE' && selectedDate === new Date().toISOString().slice(0, 10)
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-100'
                      }`}
                    >
                      Today
                    </button>

                    <button
                      type="button"
                      onClick={() => setFilterScope('DATE')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                        filterScope === 'DATE' && selectedDate !== new Date().toISOString().slice(0, 10)
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-100'
                      }`}
                    >
                      Specific Date
                    </button>

                    <button
                      type="button"
                      onClick={() => setFilterScope('MONTH')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                        filterScope === 'MONTH'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-100'
                      }`}
                    >
                      This Month
                    </button>

                    <button
                      type="button"
                      onClick={() => setFilterScope('ALL')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                        filterScope === 'ALL'
                          ? 'bg-stone-900 text-amber-300 shadow-xs'
                          : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-100'
                      }`}
                    >
                      All Time (Full Year History)
                    </button>
                  </div>

                  {/* Right Actions: Export & Reset */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      id="btn-export-csv"
                      onClick={() => exportCSV('CURRENT')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 rounded-lg text-xs font-semibold transition-colors"
                      title="Download CSV for the currently filtered view"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export CSV
                    </button>

                    <button
                      onClick={() => exportCSV('ALL')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 rounded-lg text-xs font-semibold transition-colors"
                      title="Download the entire all-time ledger database (up to 1+ year history)"
                    >
                      <Download className="w-3.5 h-3.5 text-stone-600" />
                      Export Full Year DB
                    </button>

                    <button
                      onClick={() => window.print()}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Print
                    </button>

                    {/* Reset Ledger Button: Password Protected */}
                    <button
                      id="btn-reset-ledger"
                      onClick={() => setIsLedgerResetAuthOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg text-xs font-semibold transition-colors ml-auto sm:ml-0"
                      title="Protected action: Requires administrator password authentication"
                    >
                      <Lock className="w-3.5 h-3.5 text-rose-600" />
                      Reset Ledger
                    </button>
                  </div>
                </div>

                {/* Secondary Bar: Date Picker and Realtime Search */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-stone-200">
                  {filterScope !== 'ALL' ? (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-stone-500" />
                      <span className="text-xs font-semibold text-stone-700">
                        {filterScope === 'MONTH' ? 'Selected Month:' : 'Selected Date:'}
                      </span>
                      <input
                        type={filterScope === 'MONTH' ? 'month' : 'date'}
                        value={filterScope === 'MONTH' ? selectedDate.slice(0, 7) : selectedDate}
                        onChange={(e) => {
                          if (filterScope === 'MONTH') {
                            setSelectedDate(`${e.target.value}-01`);
                          } else {
                            setSelectedDate(e.target.value);
                          }
                        }}
                        className="px-2.5 py-1 bg-white border border-stone-300 rounded-lg text-xs font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-stone-600">
                      <span className="px-2 py-0.5 bg-stone-200 text-stone-800 font-bold rounded text-[11px]">
                        Lifetime / Full Year Mode
                      </span>
                      <span>Displaying all saved records without date restrictions.</span>
                    </div>
                  )}

                  {/* Realtime Search Input */}
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search guest name, phone, room, or ref..."
                      className="w-full pl-8 pr-7 py-1 text-xs bg-white border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
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

              {/* High-Level Metric Tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Total Collections */}
                <div className="bg-stone-900 text-white p-3.5 rounded-xl">
                  <span className="text-[10px] text-stone-400 block uppercase font-bold">Total Collections</span>
                  <span className="text-xl font-black text-amber-400 mt-1 block">
                    {formatCurrency(totalCollected)}
                  </span>
                  <span className="text-[10px] text-stone-400 mt-0.5 block">
                    {displayedPayments.length} transactions recorded
                  </span>
                </div>

                {/* Cash Collections */}
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-950 p-3.5 rounded-xl">
                  <span className="text-[10px] text-emerald-700 block uppercase font-bold">Cash in Drawer</span>
                  <span className="text-xl font-black text-emerald-800 mt-1 block">
                    {formatCurrency(cashCollected)}
                  </span>
                  <span className="text-[10px] text-emerald-600 mt-0.5 block">Physical register count</span>
                </div>

                {/* UPI Collections */}
                <div className="bg-sky-50 border border-sky-200 text-sky-950 p-3.5 rounded-xl">
                  <span className="text-[10px] text-sky-700 block uppercase font-bold">UPI / QR (GPay/PhonePe)</span>
                  <span className="text-xl font-black text-sky-800 mt-1 block">
                    {formatCurrency(upiCollected)}
                  </span>
                  <span className="text-[10px] text-sky-600 mt-0.5 block">Bank account credits</span>
                </div>

                {/* Card Collections */}
                <div className="bg-indigo-50 border border-indigo-200 text-indigo-950 p-3.5 rounded-xl">
                  <span className="text-[10px] text-indigo-700 block uppercase font-bold">Card Swipe (POS)</span>
                  <span className="text-xl font-black text-indigo-800 mt-1 block">
                    {formatCurrency(cardCollected)}
                  </span>
                  <span className="text-[10px] text-indigo-600 mt-0.5 block">EDC machine batches</span>
                </div>
              </div>

              {/* Transactions Ledger Table with Individual Delete */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-stone-800 uppercase tracking-wider">
                    Payment Ledger Receipts ({displayedPayments.length})
                  </h4>
                  <span className="text-[11px] text-stone-500">
                    Each record is individually deletable
                  </span>
                </div>

                <div className="border border-stone-200 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-stone-100 text-stone-700 font-semibold border-b border-stone-200">
                      <tr>
                        <th className="p-2.5">Date & Time</th>
                        <th className="p-2.5">Room</th>
                        <th className="p-2.5">Guest Particulars</th>
                        <th className="p-2.5">Type</th>
                        <th className="p-2.5">Mode</th>
                        <th className="p-2.5">Ref / Notes</th>
                        <th className="p-2.5 text-right">Amount (₹)</th>
                        <th className="p-2.5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200 bg-white">
                      {displayedPayments.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-stone-400">
                            No payment transactions recorded in ledger.
                          </td>
                        </tr>
                      ) : (
                        displayedPayments.map((p) => (
                          <tr key={p.id} className="hover:bg-stone-50">
                            <td className="p-2.5 text-stone-600 whitespace-nowrap">
                              {formatDateTime(p.paidAt)}
                            </td>
                            <td className="p-2.5 font-bold text-stone-900">Room {p.roomNumber}</td>
                            <td className="p-2.5 font-medium text-stone-800">{p.guestName}</td>
                            <td className="p-2.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  p.type === 'ADVANCE'
                                    ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}
                              >
                                {p.type === 'ADVANCE' ? 'Advance' : 'Settlement'}
                              </span>
                            </td>
                            <td className="p-2.5 font-semibold text-stone-800">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[11px] ${
                                  p.method === 'Cash'
                                    ? 'bg-emerald-100 text-emerald-900'
                                    : p.method === 'UPI'
                                    ? 'bg-sky-100 text-sky-900'
                                    : 'bg-indigo-100 text-indigo-900'
                                }`}
                              >
                                {p.method}
                              </span>
                            </td>
                            <td className="p-2.5 text-stone-500 text-[11px]">
                              {p.referenceNumber || p.notes || '—'}
                            </td>
                            <td className="p-2.5 text-right font-black text-stone-900">
                              {formatCurrency(p.amount)}
                            </td>
                            <td className="p-2.5 text-center whitespace-nowrap">
                              <button
                                id={`btn-delete-payment-${p.id}`}
                                onClick={() => handleDeletePaymentItem(p)}
                                title={`Delete payment of ₹${p.amount} for Room ${p.roomNumber}`}
                                className="inline-flex items-center gap-1 px-2 py-1 text-stone-400 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-lg text-xs font-semibold transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                <span className="sr-only sm:not-sr-only">Delete</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Guest Stay & Booking History with Individual Delete */}
              <div className="space-y-2 pt-2 border-t border-stone-200">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-stone-500" />
                    Guest Stay & Reservation Records ({displayedBookings.length}
                    {displayedBookings.length !== bookings.length && ` of ${bookings.length}`})
                  </h4>
                  <span className="text-[11px] text-stone-500">
                    Individually deletable stay logs
                  </span>
                </div>

                {displayedBookings.length === 0 ? (
                  <p className="text-xs text-stone-400 italic bg-stone-50 p-4 rounded-xl border border-stone-200 text-center">
                    {searchQuery
                      ? 'No guest stay records matched your search query.'
                      : 'No guest stay records found for this period.'}
                  </p>
                ) : (
                  <div className="border border-stone-200 rounded-xl overflow-hidden shadow-xs">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-stone-100 text-stone-700 font-semibold border-b border-stone-200">
                        <tr>
                          <th className="p-2.5">Room</th>
                          <th className="p-2.5">Guest</th>
                          <th className="p-2.5">Phone</th>
                          <th className="p-2.5">Status</th>
                          <th className="p-2.5">Check-In</th>
                          <th className="p-2.5">Check-Out</th>
                          <th className="p-2.5 text-right">Tariff / Night</th>
                          <th className="p-2.5 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200 bg-white">
                        {displayedBookings.map((b) => (
                          <tr key={b.id} className="hover:bg-stone-50">
                            <td className="p-2.5 font-bold text-stone-900">Room {b.roomNumber}</td>
                            <td className="p-2.5 font-medium text-stone-800">{b.guest.fullName}</td>
                            <td className="p-2.5 text-stone-600">{b.guest.phone}</td>
                            <td className="p-2.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  b.status === 'CHECKED_IN'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-stone-100 text-stone-700'
                                }`}
                              >
                                {b.status === 'CHECKED_IN' ? 'Active Stay' : 'Completed'}
                              </span>
                            </td>
                            <td className="p-2.5 text-stone-600 whitespace-nowrap">
                              {formatDateTime(b.checkInTime)}
                            </td>
                            <td className="p-2.5 text-stone-600 whitespace-nowrap">
                              {b.actualCheckOutTime
                                ? formatDateTime(b.actualCheckOutTime)
                                : formatDateTime(b.expectedCheckOutTime)}
                            </td>
                            <td className="p-2.5 text-right font-black text-stone-900">
                              ₹{b.appliedRoomRate}
                            </td>
                            <td className="p-2.5 text-center whitespace-nowrap">
                              <button
                                id={`btn-delete-booking-${b.id}`}
                                onClick={() =>
                                  handleDeleteBookingItem(b.id, b.roomNumber, b.guest.fullName)
                                }
                                title={`Delete stay record for Room ${b.roomNumber} (${b.guest.fullName})`}
                                className="inline-flex items-center gap-1 px-2 py-1 text-stone-400 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-lg text-xs font-semibold transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                <span className="sr-only sm:not-sr-only">Delete</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: HOUSEKEEPING */}
          {activeTab === 'housekeeping' && (
            <div className="space-y-6">
              {/* Cleaning Needed Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                  <h4 className="font-bold text-xs text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600 animate-spin" />
                    Rooms Needing Cleaning & Sanitization ({cleaningRooms.length})
                  </h4>
                  <span className="text-xs text-stone-500">Fast 1-click status recovery</span>
                </div>

                {cleaningRooms.length === 0 ? (
                  <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-xl text-center text-emerald-800">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                    <p className="font-bold text-sm">All Rooms Clean & Ready!</p>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      No housekeeping backlogs. All guest checkout turnarounds are completed.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {cleaningRooms.map((r) => (
                      <div
                        key={r.id}
                        className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-black text-amber-950">Room {r.number}</span>
                            <span className="text-xs font-semibold px-2 py-0.5 bg-white border border-amber-300 rounded text-amber-800">
                              {r.floor} • {r.isAcEquipped ? 'AC Room' : 'Non-AC'}
                            </span>
                          </div>
                          <p className="text-xs text-amber-800 mt-1">
                            Linen change, bathroom sanitization, floor mop required.
                          </p>
                          {r.lastCleanedAt && (
                            <span className="text-[10px] text-stone-400 block mt-1">
                              Last cleaned: {formatDateTime(r.lastCleanedAt)}
                            </span>
                          )}
                        </div>

                        <button
                          id={`btn-mark-clean-${r.number}`}
                          onClick={() => markRoomCleaned(r.id)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shrink-0 shadow transition-colors flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Mark Ready
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Maintenance Blocked Rooms */}
              <div className="space-y-3 pt-4 border-t border-stone-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-2">
                  <h4 className="font-bold text-xs text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Wrench className="w-4 h-4 text-stone-600" />
                    Rooms Under Maintenance / Blocked ({maintenanceRooms.length})
                  </h4>

                  {/* Quick Block Room Selector */}
                  <div className="flex items-center gap-2">
                    <select
                      id="select-quick-block-room"
                      value=""
                      onChange={(e) => {
                        const target = rooms.find((rm) => rm.id === e.target.value);
                        if (target) {
                          setBlockRoomTarget(target);
                        }
                      }}
                      className="text-xs bg-white border border-stone-300 rounded-lg px-2.5 py-1 text-stone-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="" disabled>
                        + Block a Room for Repair...
                      </option>
                      {rooms
                        .filter((r) => r.status !== 'MAINTENANCE' && r.status !== 'OCCUPIED')
                        .map((r) => (
                          <option key={r.id} value={r.id}>
                            Room {r.number} ({r.floor}) - {r.status === 'AVAILABLE' ? 'Available' : 'Cleaning'}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {maintenanceRooms.length === 0 ? (
                  <p className="text-xs text-stone-400 italic">No rooms currently under maintenance.</p>
                ) : (
                  <div className="space-y-2">
                    {maintenanceRooms.map((r) => (
                      <div
                        key={r.id}
                        className="bg-stone-100 border border-stone-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-stone-900 text-sm">Room {r.number} ({r.floor})</span>
                            <span className="px-2 py-0.5 bg-stone-200 text-stone-700 text-[10px] font-bold rounded">
                              BLOCKED
                            </span>
                          </div>
                          <p className="text-xs text-stone-600 mt-0.5">
                            Reason: {r.maintenanceReason || 'General Maintenance'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            onClick={() => setBlockRoomTarget(r)}
                            className="px-2.5 py-1.5 bg-white hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg border border-stone-300 transition-colors"
                            title="Edit block details or reason"
                          >
                            Edit Reason
                          </button>
                          <button
                            onClick={() => unblockRoom(r.id)}
                            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors"
                          >
                            Mark Resolved & Available
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-100 border-t border-stone-200 flex justify-end">
          <button
            onClick={() => setIsDailyLedgerOpen(false)}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Close Ledger
          </button>
        </div>
      </div>

      {/* Password-protected Ledger Reset Authentication Dialog */}
      <AdminResetModal
        isOpen={isLedgerResetAuthOpen}
        onClose={() => setIsLedgerResetAuthOpen(false)}
        onConfirm={async () => {
          await clearLedgerData();
        }}
        title="Daily Ledger Reset Authorization"
        subtitle="Password protected security clearance"
        description="Resetting the Daily Ledger will wipe all recorded transactions, collections, and guest stay records to a clean state. To execute this reset, please enter the administrator master password."
        actionButtonLabel="Verify & Clear Ledger"
      />
    </div>
  );
};
