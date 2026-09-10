import React, { useState, useEffect } from 'react';
import { usePMS } from '../context/PMSContext';
import { IdProofType, BillingCycleType, PaymentMethod, Room } from '../types';
import { formatCurrency } from '../utils/billing';
import {
  X,
  LogIn,
  User,
  Phone,
  Car,
  MapPin,
  Calendar,
  IndianRupee,
  Wind,
  Fan,
  FileText,
  Clock,
  ShieldCheck,
  Bed,
  Plus,
  Minus,
  Check,
} from 'lucide-react';

const COMMON_TARIFF_PRESETS = [800, 1000, 1200, 1500, 1800, 2000, 2500, 3000];

export const CheckInModal: React.FC = () => {
  const { checkInRoom, setCheckInRoom, rooms, checkIn } = usePMS();

  // Selected room for checkin
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');

  // Form State
  const [fullName, setFullName] = useState('');
  const [primaryPhone, setPrimaryPhone] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [idProofType, setIdProofType] = useState<IdProofType>('Aadhaar');
  const [idNumber, setIdNumber] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [homeCity, setHomeCity] = useState('');
  const [homeState, setHomeState] = useState('Tamil Nadu');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

  // Dynamic Demand Pricing & AC preference
  const [tariffPerDay, setTariffPerDay] = useState<number>(1000);
  const [isAcOpted, setIsAcOpted] = useState<boolean>(true);
  const [billingCycleType, setBillingCycleType] = useState<BillingCycleType>('24_HOUR_CYCLE');

  // Extra Bed Option (150 INR extra per day)
  const [hasExtraBed, setHasExtraBed] = useState<boolean>(false);
  const [extraBedCount, setExtraBedCount] = useState<number>(1);

  // Timestamps
  const [checkInTime, setCheckInTime] = useState<string>('');
  const [expectedCheckOutDays, setExpectedCheckOutDays] = useState<number>(1);

  // Advance Payment
  const [advanceAmount, setAdvanceAmount] = useState<number>(1000);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [paymentRef, setPaymentRef] = useState('');
  const [initialNote, setInitialNote] = useState('');

  // Error message
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (checkInRoom) {
      setSelectedRoomId(checkInRoom.id);
      setIsAcOpted(checkInRoom.isAcEquipped ? checkInRoom.isAcActive : false);
      // No fixed price; start with custom demand pricing
      setTariffPerDay(1000);
      setAdvanceAmount(1000);
      setHasExtraBed(false);
      setExtraBedCount(1);

      const now = new Date();
      const tzOffset = now.getTimezoneOffset() * 60000;
      const localISOTime = new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
      setCheckInTime(localISOTime);
    }
  }, [checkInRoom]);

  if (!checkInRoom) return null;

  // Active chosen room
  const activeRoom: Room = rooms.find((r) => r.id === selectedRoomId) || checkInRoom;

  // Available rooms for switching if desired
  const availableRooms = rooms.filter((r) => r.status === 'AVAILABLE' || r.id === checkInRoom.id);

  const handleRoomChange = (newRoomId: string) => {
    setSelectedRoomId(newRoomId);
    const r = rooms.find((x) => x.id === newRoomId);
    if (r) {
      setIsAcOpted(r.isAcEquipped ? r.isAcActive : false);
    }
  };

  const handleSelectPresetTariff = (amount: number) => {
    setTariffPerDay(amount);
    setAdvanceAmount(amount + (hasExtraBed ? extraBedCount * 150 : 0));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!fullName.trim()) {
      setErrorMessage('Please enter guest full name.');
      return;
    }
    if (!primaryPhone.trim() || primaryPhone.replace(/\D/g, '').length < 10) {
      setErrorMessage('Please enter a valid 10-digit primary phone number.');
      return;
    }
    if (!idNumber.trim()) {
      setErrorMessage('Please enter ID Document number.');
      return;
    }
    if (!homeCity.trim()) {
      setErrorMessage('Please specify home city/town.');
      return;
    }
    if (tariffPerDay <= 0) {
      setErrorMessage('Please enter a valid daily tariff greater than ₹0.');
      return;
    }

    const checkInDate = new Date(checkInTime || Date.now());
    const expectedCheckoutDate = new Date(
      checkInDate.getTime() + expectedCheckOutDays * 24 * 60 * 60 * 1000
    );

    try {
      checkIn({
        roomId: activeRoom.id,
        guest: {
          fullName: fullName.trim(),
          primaryPhone: primaryPhone.trim(),
          alternatePhone: alternatePhone.trim() || undefined,
          idProofType,
          idNumber: idNumber.trim(),
          vehicleNumber: vehicleNumber.trim() || undefined,
          homeCity: homeCity.trim(),
          homeState: homeState.trim(),
          adults: Number(adults) || 1,
          children: Number(children) || 0,
        },
        tariffPerDay: Number(tariffPerDay),
        billingCycleType,
        isAcOpted,
        hasExtraBed,
        extraBedCount: hasExtraBed ? extraBedCount : 0,
        checkInTime: checkInDate.toISOString(),
        expectedCheckOutTime: expectedCheckoutDate.toISOString(),
        advancePayment: {
          amount: Number(advanceAmount) || 0,
          method: paymentMethod,
          referenceNumber: paymentRef.trim() || undefined,
        },
        initialNote: initialNote.trim() || undefined,
      });

      setCheckInRoom(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to complete check-in.');
    }
  };

  const calculatedDailyTotal = tariffPerDay + (hasExtraBed ? extraBedCount * 150 : 0);

  return (
    <div
      id="modal-checkin-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-xs overflow-y-auto"
      onClick={() => setCheckInRoom(null)}
    >
      <div
        id="modal-checkin-content"
        className="bg-white rounded-2xl max-w-3xl w-full border border-stone-200 shadow-2xl overflow-hidden my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600/30 text-emerald-400 rounded-lg border border-emerald-500/30">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">
                  Fast Front-Desk Check-In — Room {activeRoom.number}
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-stone-800 text-stone-300 border border-stone-700">
                  {activeRoom.floor}
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Sri Bhavani Vasavi Bhavan • Tiruvannamalai
              </p>
            </div>
          </div>
          <button
            onClick={() => setCheckInRoom(null)}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="bg-rose-50 border-b border-rose-200 px-6 py-2.5 text-xs text-rose-800 font-semibold flex items-center gap-2">
            <span>⚠️ {errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto text-xs sm:text-sm">
          {/* Section 1: Room Selection, AC Mode & Custom Demand Pricing */}
          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <span className="font-bold text-stone-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                1. Room Allocation & Custom Demand Pricing
              </span>
              <span className="text-xs text-stone-500">No fixed prices • Set based on demand</span>
            </div>

            {/* Room Selector & AC Toggle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Room Selector */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Assigned Room
                </label>
                <select
                  id="checkin-room-select"
                  value={selectedRoomId}
                  onChange={(e) => handleRoomChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-bold text-stone-900 focus:ring-2 focus:ring-stone-900"
                >
                  {availableRooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      Room {r.number} ({r.floor} • {r.isAcEquipped ? 'AC Room' : 'Non-AC Room'} • {r.bedType})
                    </option>
                  ))}
                </select>
              </div>

              {/* AC Mode Option Toggle */}
              <div>
                {activeRoom.isAcEquipped ? (
                  <>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Customer AC Choice (Turn OFF AC for Non-AC Guest)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAcOpted(true)}
                        className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                          isAcOpted
                            ? 'bg-sky-700 text-white border-sky-700 shadow-xs'
                            : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                        }`}
                      >
                        <Wind className="w-3.5 h-3.5" />
                        AC Mode (Turn ON)
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsAcOpted(false)}
                        className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                          !isAcOpted
                            ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                            : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                        }`}
                      >
                        <Fan className="w-3.5 h-3.5" />
                        Non-AC (Turn OFF AC)
                      </button>
                    </div>
                    <p className="text-[10px] text-stone-500 mt-1">
                      {isAcOpted
                        ? 'Customer opted for AC: unit is turned ON for this stay.'
                        : 'Customer opted for Non-AC: AC unit will be powered OFF.'}
                    </p>
                  </>
                ) : (
                  <>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Room AC Configuration
                    </label>
                    <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 flex items-center gap-2">
                      <Fan className="w-4 h-4 text-amber-700 shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-amber-950 block">Dedicated Non-AC Room</span>
                        <span className="text-[10px] text-amber-800 block">Room is equipped with ceiling fan. Standard Non-AC tariff applies.</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Custom Demand Tariff Entry */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-stone-900">
                  Agreed Daily Room Tariff (₹ / day) — Custom Demand Pricing <span className="text-rose-600">*</span>
                </label>
                <span className="text-[11px] text-stone-500 font-medium">
                  Quick Suggestions:
                </span>
              </div>
              <p className="text-[10px] text-stone-500 mb-1.5">
                Pricing varies based on temple festival & demand. Enter any custom agreed rate:
              </p>

              {/* Fast Demand Presets */}
              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                {COMMON_TARIFF_PRESETS.map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => handleSelectPresetTariff(rate)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
                      tariffPerDay === rate
                        ? 'bg-stone-900 text-white border-stone-900'
                        : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    ₹{rate}
                  </button>
                ))}
              </div>

              {/* Open numeric tariff input */}
              <div className="relative max-w-xs">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500 font-bold text-sm">₹</span>
                <input
                  id="checkin-tariff-input"
                  type="number"
                  min="1"
                  step="50"
                  required
                  value={tariffPerDay || ''}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setTariffPerDay(val);
                    setAdvanceAmount(val + (hasExtraBed ? extraBedCount * 150 : 0));
                  }}
                  placeholder="Enter custom rate for today"
                  className="w-full pl-8 pr-3 py-2 bg-white border-2 border-stone-300 focus:border-stone-900 rounded-lg text-sm font-black text-stone-900"
                />
              </div>
            </div>

            {/* Extra Bed Option (150 INR extra) */}
            <div className="bg-white p-3.5 rounded-xl border border-stone-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    id="checkin-extra-bed-checkbox"
                    type="checkbox"
                    checked={hasExtraBed}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setHasExtraBed(checked);
                      const bedAddition = checked ? extraBedCount * 150 : 0;
                      setAdvanceAmount(tariffPerDay + bedAddition);
                    }}
                    className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                  />
                  <div>
                    <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                      <Bed className="w-4 h-4 text-amber-600" />
                      Add Extra Bed / Floor Mattress (Optional)
                    </span>
                    <span className="text-[11px] text-stone-500 block">
                      Standard lodge charge: <strong>₹150 extra per bed / day</strong>
                    </span>
                  </div>
                </label>

                {hasExtraBed && (
                  <div className="flex items-center gap-2 pl-6 sm:pl-0">
                    <span className="text-xs text-stone-600 font-semibold">Qty:</span>
                    <div className="flex items-center border border-stone-300 rounded-lg bg-stone-50">
                      <button
                        type="button"
                        onClick={() => {
                          const newCount = Math.max(1, extraBedCount - 1);
                          setExtraBedCount(newCount);
                          setAdvanceAmount(tariffPerDay + newCount * 150);
                        }}
                        className="p-1.5 text-stone-600 hover:text-stone-900"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2.5 font-bold text-xs text-stone-900">{extraBedCount}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const newCount = Math.min(3, extraBedCount + 1);
                          setExtraBedCount(newCount);
                          setAdvanceAmount(tariffPerDay + newCount * 150);
                        }}
                        className="p-1.5 text-stone-600 hover:text-stone-900"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-xs font-bold text-amber-900 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                      +₹{extraBedCount * 150}/day
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Total Daily Rate Indicator */}
            <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3 flex items-center justify-between text-xs text-amber-950">
              <div>
                <span className="font-bold">Total Daily Agreed Rate:</span>
                <span className="text-[11px] text-stone-600 ml-1">
                  Room ₹{tariffPerDay} {hasExtraBed ? `+ Extra Bed ₹${extraBedCount * 150}` : ''} ({isAcOpted ? 'AC' : 'Non-AC'})
                </span>
              </div>
              <span className="text-base font-black text-amber-950">
                {formatCurrency(calculatedDailyTotal)} / day
              </span>
            </div>

            {/* Billing Cycle & Expected Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Billing Cycle Rule
                </label>
                <select
                  id="checkin-cycle-select"
                  value={billingCycleType}
                  onChange={(e) => setBillingCycleType(e.target.value as BillingCycleType)}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-medium text-stone-900"
                >
                  <option value="24_HOUR_CYCLE">24-Hour Cycle (Pilgrim Standard)</option>
                  <option value="STANDARD_11AM">Standard 11:00 AM Checkout</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-stone-500" />
                  Check-In Time
                </label>
                <input
                  id="checkin-time-input"
                  type="datetime-local"
                  value={checkInTime}
                  onChange={(e) => setCheckInTime(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs text-stone-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-stone-500" />
                  Expected Stay Duration
                </label>
                <select
                  id="checkin-expected-days"
                  value={expectedCheckOutDays}
                  onChange={(e) => setExpectedCheckOutDays(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs text-stone-800"
                >
                  <option value="1">1 Day (Girivalam / Darshan)</option>
                  <option value="2">2 Days (Weekend Stay)</option>
                  <option value="3">3 Days (Festival Stay)</option>
                  <option value="5">5 Days (Extended Stay)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Guest Details */}
          <div className="space-y-3">
            <span className="font-bold text-stone-900 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-stone-200 pb-1.5">
              <User className="w-4 h-4 text-amber-600" />
              2. Guest Particulars & ID Proof
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Guest Full Name <span className="text-rose-600">*</span>
                </label>
                <input
                  id="checkin-guest-name"
                  type="text"
                  required
                  placeholder="e.g. S. Murugan / R. Ramanathan"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs sm:text-sm text-stone-900 focus:ring-2 focus:ring-stone-900"
                />
              </div>

              {/* Primary Phone */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Primary Mobile Number <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="checkin-primary-phone"
                    type="tel"
                    required
                    placeholder="10-digit mobile (e.g. 9840123456)"
                    value={primaryPhone}
                    onChange={(e) => setPrimaryPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-lg text-xs sm:text-sm text-stone-900 focus:ring-2 focus:ring-stone-900"
                  />
                </div>
              </div>

              {/* Alternate Phone */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Alternate Phone (Optional)
                </label>
                <input
                  id="checkin-alt-phone"
                  type="tel"
                  placeholder="Co-traveler mobile"
                  value={alternatePhone}
                  onChange={(e) => setAlternatePhone(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs sm:text-sm text-stone-900"
                />
              </div>

              {/* Vehicle Number */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
                  <Car className="w-3.5 h-3.5 text-stone-500" />
                  Vehicle Number (Lodge Parking)
                </label>
                <input
                  id="checkin-vehicle-no"
                  type="text"
                  placeholder="e.g. TN-25-AB-1234 / KA-01-MJ-5678"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs sm:text-sm text-stone-900 uppercase"
                />
              </div>

              {/* ID Proof Type */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  ID Proof Type <span className="text-rose-600">*</span>
                </label>
                <select
                  id="checkin-id-type"
                  value={idProofType}
                  onChange={(e) => setIdProofType(e.target.value as IdProofType)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs sm:text-sm text-stone-900"
                >
                  <option value="Aadhaar">Aadhaar Card (UIDAI)</option>
                  <option value="Voter ID">Voter ID Card</option>
                  <option value="Driving License">Driving License</option>
                  <option value="Passport">Passport</option>
                </select>
              </div>

              {/* ID Number */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  ID Document Number <span className="text-rose-600">*</span>
                </label>
                <input
                  id="checkin-id-number"
                  type="text"
                  required
                  placeholder="e.g. 5432 9876 1234"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs sm:text-sm text-stone-900 uppercase"
                />
              </div>

              {/* Home City */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-stone-500" />
                  Home City / Town <span className="text-rose-600">*</span>
                </label>
                <input
                  id="checkin-home-city"
                  type="text"
                  required
                  placeholder="e.g. Chennai, Bangalore, Salem, Madurai"
                  value={homeCity}
                  onChange={(e) => setHomeCity(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs sm:text-sm text-stone-900"
                />
              </div>

              {/* Home State */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Home State <span className="text-rose-600">*</span>
                </label>
                <input
                  id="checkin-home-state"
                  type="text"
                  required
                  value={homeState}
                  onChange={(e) => setHomeState(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs sm:text-sm text-stone-900"
                />
              </div>

              {/* Adults & Children */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Adults</label>
                  <input
                    id="checkin-adults-count"
                    type="number"
                    min="1"
                    max="6"
                    value={adults}
                    onChange={(e) => setAdults(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs sm:text-sm text-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Children</label>
                  <input
                    id="checkin-children-count"
                    type="number"
                    min="0"
                    max="4"
                    value={children}
                    onChange={(e) => setChildren(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs sm:text-sm text-stone-900"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Advance Payment Collection */}
          <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 space-y-3">
            <span className="font-bold text-emerald-950 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-emerald-200 pb-1.5">
              <IndianRupee className="w-4 h-4 text-emerald-600" />
              3. Advance Payment Collection
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Advance Amount */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Advance Collected (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-stone-500">₹</span>
                  <input
                    id="checkin-advance-amount"
                    type="number"
                    min="0"
                    step="50"
                    value={advanceAmount}
                    onChange={(e) => setAdvanceAmount(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2 bg-white border border-stone-300 rounded-lg text-xs sm:text-sm font-bold text-stone-900"
                  />
                </div>
              </div>

              {/* Payment Mode */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Payment Mode
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {(['Cash', 'UPI', 'Card'] as PaymentMethod[]).map((mode) => (
                    <button
                      type="button"
                      key={mode}
                      onClick={() => setPaymentMethod(mode)}
                      className={`py-2 px-1 text-xs font-bold rounded-lg border text-center transition-colors ${
                        paymentMethod === mode
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                          : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reference Number */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Ref / Transaction ID (Optional)
                </label>
                <input
                  id="checkin-payment-ref"
                  type="text"
                  placeholder={paymentMethod === 'UPI' ? 'GPay / PhonePe UTR' : 'Cash slip #'}
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs sm:text-sm text-stone-900"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Front Desk Remarks */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-stone-500" />
              Front Desk Note / Guest Special Requirements (Optional)
            </label>
            <input
              id="checkin-initial-note"
              type="text"
              placeholder="e.g. Pilgrims visiting Ramanasramam & temple; requested 4:30 AM hot water."
              value={initialNote}
              onChange={(e) => setInitialNote(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs sm:text-sm text-stone-900"
            />
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-stone-200">
            <button
              type="button"
              onClick={() => setCheckInRoom(null)}
              className="px-4 py-2 border border-stone-300 text-stone-700 hover:bg-stone-100 rounded-xl text-xs sm:text-sm font-semibold transition-colors"
            >
              Cancel
            </button>

            <button
              id="btn-submit-checkin"
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Confirm Check-In — Room {activeRoom.number}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
