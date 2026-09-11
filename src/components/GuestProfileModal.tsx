import React, { useState } from 'react';
import { usePMS } from '../context/PMSContext';
import { InteractionCategory } from '../types';
import { calculateBill, formatCurrency, formatDateTime } from '../utils/billing';
import {
  X,
  User,
  Phone,
  Car,
  MapPin,
  CreditCard,
  Clock,
  Plus,
  Trash2,
  Send,
  MessageSquare,
  BedDouble,
  LogOut,
  Coffee,
  CheckCircle2,
  AlertTriangle,
  FileText,
  BadgePercent,
  Sparkles,
  PhoneCall,
  BellRing,
} from 'lucide-react';

export const GuestProfileModal: React.FC = () => {
  const {
    viewingRoom,
    setViewingRoom,
    getActiveBookingForRoom,
    addConversationLog,
    addRoomCharge,
    removeRoomCharge,
    setCheckOutBooking,
  } = usePMS();

  // Active sub-tab in modal: 'overview' | 'interactions' | 'charges'
  const [activeTab, setActiveTab] = useState<'overview' | 'interactions' | 'charges'>('overview');

  // New interaction form state
  const [logCategory, setLogCategory] = useState<InteractionCategory>('Front Desk Note');
  const [staffName, setStaffName] = useState('Front Desk');
  const [summary, setSummary] = useState('');

  // New charge quick add
  const [selectedPresetCharge, setSelectedPresetCharge] = useState<string>('water');
  const [customChargeItem, setCustomChargeItem] = useState('');
  const [chargeQty, setChargeQty] = useState(1);
  const [chargePrice, setChargePrice] = useState(20);

  if (!viewingRoom) return null;

  const booking = getActiveBookingForRoom(viewingRoom.id);
  if (!booking) {
    return null;
  }

  const bill = calculateBill(booking);

  const PRESET_CHARGES = [
    { key: 'mattress', label: 'Extra Bed / Mattress (+₹150/day)', price: 150 },
    { key: 'water', label: 'Bisleri Water Bottle 1L', price: 20 },
    { key: 'coffee', label: 'Filter Coffee / Tea', price: 25 },
    { key: 'laundry', label: 'Laundry Service', price: 150 },
    { key: 'late_fee', label: 'Late Check-out Extension', price: 300 },
    { key: 'custom', label: 'Other / Custom Charge', price: 0 },
  ];

  const handlePresetSelect = (key: string) => {
    setSelectedPresetCharge(key);
    const preset = PRESET_CHARGES.find((p) => p.key === key);
    if (preset) {
      if (key !== 'custom') {
        setCustomChargeItem(preset.label);
        setChargePrice(preset.price);
      } else {
        setCustomChargeItem('');
        setChargePrice(100);
      }
    }
  };

  const handleAddCharge = (e: React.FormEvent) => {
    e.preventDefault();
    const itemName =
      selectedPresetCharge === 'custom'
        ? customChargeItem.trim()
        : PRESET_CHARGES.find((p) => p.key === selectedPresetCharge)?.label || customChargeItem;

    if (!itemName) return;
    if (chargePrice <= 0) return;

    addRoomCharge(booking.id, {
      item: itemName,
      quantity: Number(chargeQty) || 1,
      unitPrice: Number(chargePrice) || 0,
      addedBy: staffName || 'Front Desk',
    });

    // Reset
    setChargeQty(1);
  };

  const handleAddConversation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim()) return;

    addConversationLog(booking.id, {
      category: logCategory,
      staffName: staffName.trim() || 'Staff',
      summary: summary.trim(),
      status: 'Resolved',
    });

    setSummary('');
  };

  const getCategoryBadge = (cat: InteractionCategory) => {
    switch (cat) {
      case 'Phone Call':
        return {
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          icon: <PhoneCall className="w-3.5 h-3.5" />,
        };
      case 'Room Service':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: <Coffee className="w-3.5 h-3.5" />,
        };
      case 'Extra Bed / Towel':
        return {
          bg: 'bg-sky-50 text-sky-700 border-sky-200',
          icon: <BedDouble className="w-3.5 h-3.5" />,
        };
      case 'Complaint':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: <AlertTriangle className="w-3.5 h-3.5" />,
        };
      case 'Front Desk Note':
      default:
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          icon: <FileText className="w-3.5 h-3.5" />,
        };
    }
  };

  return (
    <div
      id="modal-guest-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-xs overflow-y-auto"
      onClick={() => setViewingRoom(null)}
    >
      <div
        id="modal-guest-content"
        className="bg-white rounded-2xl max-w-4xl w-full border border-stone-200 shadow-2xl overflow-hidden my-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-600/30 text-rose-400 rounded-lg border border-rose-500/30">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">
                  Room {viewingRoom.number} — {booking.guest.fullName}
                </h2>
                <span className="text-xs px-2 py-0.5 bg-stone-800 text-stone-300 rounded border border-stone-700">
                  {booking.bookingNumber}
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                {viewingRoom.bedType} • {viewingRoom.floor} • Checked in{' '}
                {formatDateTime(booking.checkInTime)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-proceed-checkout"
              onClick={() => {
                setViewingRoom(null);
                setCheckOutBooking(booking);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg shadow transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Check-Out & Settle
            </button>

            <button
              onClick={() => setViewingRoom(null)}
              className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Sub-tabs */}
        <div className="flex border-b border-stone-200 px-6 bg-stone-50 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-amber-600 text-amber-900 bg-white'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <User className="w-4 h-4 text-stone-500" />
            Guest & Bill Overview
          </button>

          <button
            onClick={() => setActiveTab('interactions')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'interactions'
                ? 'border-amber-600 text-amber-900 bg-white'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-stone-500" />
            Interaction Tracker ({booking.conversations?.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('charges')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'charges'
                ? 'border-amber-600 text-amber-900 bg-white'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Plus className="w-4 h-4 text-stone-500" />
            Add-On Charges ({booking.charges?.length || 0})
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6 text-xs sm:text-sm">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Guest Profile Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Guest Identity Card */}
                <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 space-y-3">
                  <h3 className="font-bold text-stone-900 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-stone-200 pb-2">
                    <User className="w-4 h-4 text-amber-600" /> Guest Details
                  </h3>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-stone-100">
                      <span className="text-stone-500">Full Name:</span>
                      <span className="font-bold text-stone-900">{booking.guest.fullName}</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-stone-100">
                      <span className="text-stone-500">Primary Phone:</span>
                      <a
                        href={`tel:${booking.guest.primaryPhone}`}
                        className="font-semibold text-amber-700 hover:underline flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" />
                        {booking.guest.primaryPhone}
                      </a>
                    </div>

                    {booking.guest.alternatePhone && (
                      <div className="flex justify-between py-1 border-b border-stone-100">
                        <span className="text-stone-500">Alternate Phone:</span>
                        <span className="font-medium text-stone-700">{booking.guest.alternatePhone}</span>
                      </div>
                    )}

                    <div className="flex justify-between py-1 border-b border-stone-100">
                      <span className="text-stone-500">ID Proof:</span>
                      <span className="font-medium text-stone-900">
                        {booking.guest.idProofType}: {booking.guest.idNumber}
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-stone-100">
                      <span className="text-stone-500">Origin:</span>
                      <span className="font-medium text-stone-900">
                        {booking.guest.homeCity}, {booking.guest.homeState}
                      </span>
                    </div>

                    {booking.guest.vehicleNumber && (
                      <div className="flex justify-between py-1 border-b border-stone-100">
                        <span className="text-stone-500">Vehicle No:</span>
                        <span className="font-bold text-stone-900 bg-stone-200/80 px-2 py-0.5 rounded">
                          {booking.guest.vehicleNumber}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between py-1">
                      <span className="text-stone-500">Occupancy:</span>
                      <span className="font-medium text-stone-800">
                        {booking.guest.adults} Adult{booking.guest.adults > 1 ? 's' : ''}
                        {booking.guest.children > 0 ? `, ${booking.guest.children} Child` : ''}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stay & Pricing Card */}
                <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 space-y-3">
                  <h3 className="font-bold text-stone-900 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-stone-200 pb-2">
                    <Clock className="w-4 h-4 text-amber-600" /> Stay & Live Billing
                  </h3>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-stone-100">
                      <span className="text-stone-500">Tariff Agreed:</span>
                      <span className="font-bold text-stone-900">
                        {formatCurrency(booking.tariffPerDay)} / day
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-stone-100">
                      <span className="text-stone-500">AC Preference:</span>
                      <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                        booking.isAcOpted
                          ? 'bg-sky-50 text-sky-800 border border-sky-200'
                          : 'bg-stone-200 text-stone-800'
                      }`}>
                        {booking.isAcOpted ? '❄️ AC Mode Active' : '⚪ Non-AC Mode'}
                      </span>
                    </div>

                    {booking.hasExtraBed && (
                      <div className="flex justify-between py-1 border-b border-stone-100 bg-amber-50/50 p-1.5 rounded">
                        <span className="text-stone-600 font-medium">Extra Bed (+₹150/day):</span>
                        <span className="font-bold text-amber-900">
                          {booking.extraBedCount || 1} Bed{booking.extraBedCount && booking.extraBedCount > 1 ? 's' : ''} ({formatCurrency(bill.extraBedTotal)})
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between py-1 border-b border-stone-100">
                      <span className="text-stone-500">Cycle Rule:</span>
                      <span className="font-medium text-stone-700">
                        {booking.billingCycleType === '24_HOUR_CYCLE'
                          ? '24-Hour Cycle'
                          : 'Standard 11:00 AM Checkout'}
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-stone-100">
                      <span className="text-stone-500">Time Elapsed:</span>
                      <span className="font-bold text-amber-800">{bill.durationFormatted}</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-stone-100">
                      <span className="text-stone-500">Room Rent Subtotal:</span>
                      <span className="font-semibold text-stone-900">{formatCurrency(bill.roomRentTotal)}</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-stone-100">
                      <span className="text-stone-500">Add-On Services ({booking.charges?.length || 0}):</span>
                      <span className="font-semibold text-stone-900">{formatCurrency(bill.chargesTotal)}</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-stone-100 bg-amber-50/60 p-1.5 rounded">
                      <span className="font-bold text-stone-900">Total Billed:</span>
                      <span className="font-bold text-amber-900 text-sm">{formatCurrency(bill.grandTotal)}</span>
                    </div>

                    <div className="flex justify-between py-1">
                      <span className="text-stone-500">Advance Paid:</span>
                      <span className="font-semibold text-emerald-700">
                        {formatCurrency(bill.totalPaidAdvance)}
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-t border-stone-200 pt-2 bg-stone-100 p-2 rounded-lg">
                      <span className="font-bold text-stone-800">Current Balance Due:</span>
                      <span
                        className={`text-sm font-black ${
                          bill.balanceDue > 0 ? 'text-rose-700' : 'text-emerald-700'
                        }`}
                      >
                        {formatCurrency(bill.balanceDue)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Summary of Recent Interactions & Charges */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Recent Interaction Log */}
                <div className="border border-stone-200 rounded-xl p-4 bg-white">
                  <div className="flex items-center justify-between mb-3 border-b border-stone-100 pb-2">
                    <h4 className="font-bold text-xs text-stone-800 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-amber-600" /> Recent Interaction Log
                    </h4>
                    <button
                      onClick={() => setActiveTab('interactions')}
                      className="text-[11px] text-amber-700 hover:underline"
                    >
                      + Add Log
                    </button>
                  </div>

                  {booking.conversations?.length === 0 ? (
                    <p className="text-xs text-stone-400 italic py-2">No front desk interactions logged yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {booking.conversations.slice(0, 2).map((c) => (
                        <div key={c.id} className="p-2.5 rounded-lg bg-stone-50 border border-stone-100 text-xs">
                          <div className="flex items-center justify-between text-[10px] text-stone-500 mb-1">
                            <span className="font-semibold text-stone-800">{c.category}</span>
                            <span>{new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-stone-700">{c.summary}</p>
                          <span className="text-[10px] text-stone-400 mt-1 block">Logged by {c.staffName}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add-On Charges Summary */}
                <div className="border border-stone-200 rounded-xl p-4 bg-white">
                  <div className="flex items-center justify-between mb-3 border-b border-stone-100 pb-2">
                    <h4 className="font-bold text-xs text-stone-800 flex items-center gap-1.5">
                      <Coffee className="w-3.5 h-3.5 text-amber-600" /> Add-On Items
                    </h4>
                    <button
                      onClick={() => setActiveTab('charges')}
                      className="text-[11px] text-amber-700 hover:underline"
                    >
                      + Add Charge
                    </button>
                  </div>

                  {booking.charges?.length === 0 ? (
                    <p className="text-xs text-stone-400 italic py-2">No ancillary charges added yet.</p>
                  ) : (
                    <div className="space-y-1 text-xs">
                      {booking.charges.map((chg) => (
                        <div key={chg.id} className="flex justify-between items-center py-1 border-b border-stone-100">
                          <div>
                            <span className="font-medium text-stone-800">{chg.item}</span>
                            <span className="text-[10px] text-stone-400 ml-1">
                              ({chg.quantity} × {formatCurrency(chg.unitPrice)})
                            </span>
                          </div>
                          <span className="font-bold text-stone-900">{formatCurrency(chg.totalAmount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INTERACTION & CONVERSATION TRACKER */}
          {activeTab === 'interactions' && (
            <div className="space-y-6">
              {/* Form to Log New Note */}
              <form onSubmit={handleAddConversation} className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
                <h4 className="font-bold text-xs text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-amber-600" /> Log Front Desk Interaction / Request
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Interaction Type</label>
                    <select
                      id="select-log-category"
                      value={logCategory}
                      onChange={(e) => setLogCategory(e.target.value as InteractionCategory)}
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg"
                    >
                      <option value="Phone Call">📞 Phone Call</option>
                      <option value="Room Service">🛎️ Room Service Request</option>
                      <option value="Extra Bed / Towel">🛏️ Extra Bed / Towel / Linen</option>
                      <option value="Complaint">⚠️ Complaint / Maintenance</option>
                      <option value="Front Desk Note">📝 Front Desk Note</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Staff / Attendant</label>
                    <input
                      id="input-staff-name"
                      type="text"
                      placeholder="e.g. Ramesh / Suresh / Murugan"
                      value={staffName}
                      onChange={(e) => setStaffName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg"
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <label className="block font-semibold text-stone-700 mb-1">Status</label>
                    <div className="py-2 px-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold">
                      ✓ Auto-Logged with Timestamp
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Details / Conversation Summary <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    id="input-log-summary"
                    rows={2}
                    required
                    placeholder="Enter conversation notes, guest requests, wake-up calls, temple timings provided, etc."
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    id="btn-submit-log"
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Save To Guest Thread
                  </button>
                </div>
              </form>

              {/* Conversation Timeline */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs text-stone-800 uppercase tracking-wider">
                  Timeline Log ({booking.conversations?.length || 0} Records)
                </h4>

                {booking.conversations?.length === 0 ? (
                  <div className="text-center py-8 bg-stone-50 rounded-xl border border-dashed border-stone-300 text-stone-500 text-xs">
                    No front-desk logs recorded yet. Use the form above to add phone inquiries or service notes.
                  </div>
                ) : (
                  <div className="relative border-l-2 border-amber-200 ml-4 pl-4 space-y-4">
                    {booking.conversations.map((c) => {
                      const badge = getCategoryBadge(c.category);
                      return (
                        <div key={c.id} className="relative group">
                          {/* Timeline dot */}
                          <div className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-amber-600 border-2 border-white shadow-xs" />

                          <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-xs">
                            <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
                              <span
                                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border ${badge.bg}`}
                              >
                                {badge.icon} {c.category}
                              </span>
                              <span className="text-[11px] text-stone-400">
                                {formatDateTime(c.timestamp)}
                              </span>
                            </div>

                            <p className="text-xs text-stone-800 leading-relaxed font-normal">{c.summary}</p>

                            <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between text-[10px] text-stone-400">
                              <span>Recorded by: <strong className="text-stone-600">{c.staffName}</strong></span>
                              <span className="text-emerald-700 font-semibold">Status: {c.status}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ADD-ON CHARGES */}
          {activeTab === 'charges' && (
            <div className="space-y-6">
              {/* Quick Add Form */}
              <form onSubmit={handleAddCharge} className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-4">
                <h4 className="font-bold text-xs text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-amber-600" /> Add Room Service / Add-On Charge
                </h4>

                {/* Presets */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">Quick Presets</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PRESET_CHARGES.map((p) => (
                      <button
                        type="button"
                        key={p.key}
                        onClick={() => handlePresetSelect(p.key)}
                        className={`p-2 rounded-lg border text-left text-xs transition-colors ${
                          selectedPresetCharge === p.key
                            ? 'bg-amber-100/70 border-amber-500 text-amber-950 font-bold'
                            : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        <div className="line-clamp-1">{p.label}</div>
                        <div className="text-[10px] text-stone-500 mt-0.5">
                          {p.price > 0 ? formatCurrency(p.price) : 'Custom price'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Item Description</label>
                    <input
                      id="input-charge-desc"
                      type="text"
                      required
                      placeholder="e.g. Extra Bed, Tea x 2"
                      value={
                        selectedPresetCharge === 'custom'
                          ? customChargeItem
                          : PRESET_CHARGES.find((p) => p.key === selectedPresetCharge)?.label || customChargeItem
                      }
                      onChange={(e) => {
                        setSelectedPresetCharge('custom');
                        setCustomChargeItem(e.target.value);
                      }}
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Quantity</label>
                    <input
                      id="input-charge-qty"
                      type="number"
                      min="1"
                      max="50"
                      value={chargeQty}
                      onChange={(e) => setChargeQty(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Unit Price (₹)</label>
                    <input
                      id="input-charge-price"
                      type="number"
                      min="0"
                      step="5"
                      value={chargePrice}
                      onChange={(e) => setChargePrice(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="text-xs font-semibold text-stone-700">
                    Line Total: <span className="font-bold text-stone-900">{formatCurrency(chargeQty * chargePrice)}</span>
                  </div>
                  <button
                    id="btn-add-charge-submit"
                    type="submit"
                    className="inline-flex items-center gap-1 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-400" />
                    Add Charge to Folio
                  </button>
                </div>
              </form>

              {/* Existing Charges Table */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs text-stone-800 uppercase tracking-wider">
                  Itemized Charges Folio ({booking.charges?.length || 0})
                </h4>

                {booking.charges?.length === 0 ? (
                  <div className="text-center py-8 bg-stone-50 rounded-xl border border-dashed border-stone-300 text-stone-500 text-xs">
                    No extra charges added yet. All extra mattresses, bottles, and room services will appear here.
                  </div>
                ) : (
                  <div className="border border-stone-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-stone-100 text-stone-700 font-semibold border-b border-stone-200">
                        <tr>
                          <th className="p-2.5">Item</th>
                          <th className="p-2.5 text-center">Qty</th>
                          <th className="p-2.5 text-right">Unit Price</th>
                          <th className="p-2.5 text-right">Total</th>
                          <th className="p-2.5 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200 bg-white">
                        {booking.charges.map((chg) => (
                          <tr key={chg.id} className="hover:bg-stone-50">
                            <td className="p-2.5 font-medium text-stone-900">
                              {chg.item}
                              <div className="text-[10px] text-stone-400">
                                Added by {chg.addedBy} at {new Date(chg.addedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </td>
                            <td className="p-2.5 text-center text-stone-700 font-semibold">{chg.quantity}</td>
                            <td className="p-2.5 text-right text-stone-600">{formatCurrency(chg.unitPrice)}</td>
                            <td className="p-2.5 text-right font-bold text-stone-900">{formatCurrency(chg.totalAmount)}</td>
                            <td className="p-2.5 text-center">
                              <button
                                onClick={() => removeRoomCharge(booking.id, chg.id)}
                                className="text-rose-600 hover:text-rose-800 p-1"
                                title="Remove charge"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
        </div>

        {/* Modal Bottom Footer */}
        <div className="p-4 bg-stone-100 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-stone-600">
            Current stay total: <strong className="text-stone-900">{formatCurrency(bill.grandTotal)}</strong> •
            Advance paid: <strong className="text-emerald-700">{formatCurrency(bill.totalPaidAdvance)}</strong> •
            Due: <strong className="text-rose-700">{formatCurrency(bill.balanceDue)}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewingRoom(null)}
              className="px-4 py-2 border border-stone-300 text-stone-700 hover:bg-stone-200 rounded-xl text-xs font-semibold transition-colors"
            >
              Close
            </button>

            <button
              id="btn-footer-checkout"
              onClick={() => {
                setViewingRoom(null);
                setCheckOutBooking(booking);
              }}
              className="inline-flex items-center gap-2 px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Proceed to Check-Out & Settle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
