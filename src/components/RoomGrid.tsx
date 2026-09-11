import React, { useState } from 'react';
import { usePMS } from '../context/PMSContext';
import { Room, RoomStatus, FloorName } from '../types';
import { formatCurrency, calculateBill, formatDateOnly } from '../utils/billing';
import {
  Search,
  Wind,
  Fan,
  User,
  Phone,
  Clock,
  Sparkles,
  Wrench,
  LogIn,
  Eye,
  MessageSquare,
  CheckCircle2,
  Lock,
  Plus,
  Bed,
  Check,
  Power,
  RefreshCw,
  CalendarCheck,
} from 'lucide-react';

export const RoomGrid: React.FC = () => {
  const {
    rooms,
    getActiveBookingForRoom,
    getUpcomingBookingsForRoom,
    setIsReservationsModalOpen,
    setCheckInRoom,
    setViewingRoom,
    markRoomCleaned,
    setBlockRoomTarget,
    unblockRoom,
    toggleRoomAc,
    selectedFloor,
    setSelectedFloor,
    selectedAcMode,
    setSelectedAcMode,
    selectedStatus,
    setSelectedStatus,
    searchQuery,
    setSearchQuery,
  } = usePMS();

  const [viewGrouping, setViewGrouping] = useState<'by_floor' | 'all_grid'>('by_floor');

  // Filtered rooms
  const filteredRooms = rooms.filter((room) => {
    // Floor filter
    if (selectedFloor !== 'all' && room.floor !== selectedFloor) return false;

    // AC Mode filter
    if (selectedAcMode === 'AC_ON' && !room.isAcActive) return false;
    if (selectedAcMode === 'AC_OFF' && room.isAcActive) return false;

    // Status filter
    if (selectedStatus !== 'all' && room.status !== selectedStatus) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchRoom = room.number.toLowerCase().includes(q);
      const activeBooking = getActiveBookingForRoom(room.id);
      const upcomingBookings = getUpcomingBookingsForRoom(room.id);
      const matchGuest =
        activeBooking?.guest.fullName.toLowerCase().includes(q) ||
        upcomingBookings.some((u) => u.guest.fullName.toLowerCase().includes(q));
      const matchPhone =
        activeBooking?.guest.primaryPhone.includes(q) ||
        upcomingBookings.some((u) => u.guest.primaryPhone.includes(q));
      const matchVehicle = activeBooking?.guest.vehicleNumber?.toLowerCase().includes(q);
      const matchCity =
        activeBooking?.guest.homeCity.toLowerCase().includes(q) ||
        upcomingBookings.some((u) => u.guest.homeCity.toLowerCase().includes(q));
      return matchRoom || matchGuest || matchPhone || matchVehicle || matchCity;
    }

    return true;
  });

  const getStatusBadgeStyle = (status: RoomStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return {
          pill: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold',
          dot: 'bg-emerald-600',
          topBar: 'bg-emerald-600',
          border: 'border-stone-200 hover:border-emerald-500',
          label: 'Available',
        };
      case 'OCCUPIED':
        return {
          pill: 'bg-rose-50 text-rose-800 border-rose-300 font-bold',
          dot: 'bg-rose-600',
          topBar: 'bg-rose-600',
          border: 'border-rose-300 hover:border-rose-500',
          label: 'Occupied',
        };
      case 'CLEANING_NEEDED':
        return {
          pill: 'bg-amber-50 text-amber-900 border-amber-300 font-bold',
          dot: 'bg-amber-600 animate-pulse',
          topBar: 'bg-amber-500',
          border: 'border-amber-300 hover:border-amber-500',
          label: 'Cleaning Needed',
        };
      case 'MAINTENANCE':
        return {
          pill: 'bg-stone-200 text-stone-800 border-stone-400 font-bold',
          dot: 'bg-stone-600',
          topBar: 'bg-stone-600',
          border: 'border-stone-300 opacity-95',
          label: 'Blocked / Maint.',
        };
    }
  };

  const renderRoomCard = (room: Room) => {
    const booking = getActiveBookingForRoom(room.id);
    const upcomingBookings = getUpcomingBookingsForRoom(room.id);
    const style = getStatusBadgeStyle(room.status);
    const bill = booking ? calculateBill(booking) : null;

    return (
      <div
        key={room.id}
        id={`room-card-${room.number}-${room.floorCode}`}
        className={`bg-white rounded-xl border ${style.border} transition-all duration-150 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md relative`}
      >
        {/* Top visual status accent bar */}
        <div className={`h-1.5 w-full ${style.topBar}`} />

        <div className="p-4 flex-1">
          {/* Room Header: Number, Floor, Status */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black tracking-tight text-stone-900">
                  {room.number}
                </span>
                <span className="text-[11px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                  {room.floor}
                </span>
              </div>
              <p className="text-[11px] text-stone-500 mt-1">
                {room.bedType} • Max {room.maxOccupancy} Guests
              </p>

              {/* Upcoming Reservation indicator */}
              {upcomingBookings.length > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsReservationsModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2 py-0.5 rounded-md mt-1.5 transition-colors cursor-pointer"
                  title="Click to view advance reservations"
                >
                  <CalendarCheck className="w-3 h-3 text-amber-700" />
                  <span>
                    {upcomingBookings.length} Upcoming (Next: {formatDateOnly(upcomingBookings[0].checkInTime)})
                  </span>
                </button>
              )}
            </div>

            {/* Status Pill */}
            <span
              className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${style.pill}`}
            >
              <span className={`w-2 h-2 rounded-full ${style.dot}`} />
              {style.label}
            </span>
          </div>

          {/* AC Power Toggle Switch / Non-AC Indicator (Per Room) */}
          <div className="mb-3 pt-2 border-t border-stone-100">
            {room.isAcEquipped ? (
              <div className="flex items-center justify-between bg-stone-50 p-2 rounded-lg border border-stone-200">
                <div className="flex items-center gap-1.5">
                  {room.isAcActive ? (
                    <Wind className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                  ) : (
                    <Fan className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  )}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[11px] font-bold block leading-tight ${room.isAcActive ? 'text-sky-900' : 'text-stone-700'}`}>
                        {room.isAcActive ? 'AC Active' : 'AC Turned OFF'}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${room.isAcActive ? 'bg-sky-100 text-sky-800' : 'bg-stone-200 text-stone-700'}`}>
                        {room.isAcActive ? 'AC Mode' : 'Non-AC Opted'}
                      </span>
                    </div>
                    <span className="text-[10px] text-stone-500 block leading-tight mt-0.5">
                      {room.isAcActive ? 'Customer opted for AC' : 'Customer opted for Non-AC'}
                    </span>
                  </div>
                </div>

                {/* Toggle Action to turn off / on AC */}
                <button
                  type="button"
                  id={`btn-toggle-ac-${room.number}-${room.floorCode}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleRoomAc(room.id);
                  }}
                  title={room.isAcActive ? 'Click to turn OFF AC if customer opted for Non-AC' : 'Click to turn ON AC'}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md border transition-colors flex items-center gap-1 shrink-0 ${
                    room.isAcActive
                      ? 'bg-sky-50 hover:bg-sky-100 text-sky-800 border-sky-300'
                      : 'bg-stone-200 hover:bg-stone-300 text-stone-700 border-stone-400'
                  }`}
                >
                  <Power className="w-3 h-3" />
                  {room.isAcActive ? 'Turn OFF' : 'Turn ON'}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-amber-50/70 p-2 rounded-lg border border-amber-200">
                <div className="flex items-center gap-1.5">
                  <Fan className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-amber-950 block leading-tight">
                        Dedicated Non-AC Room
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 uppercase">
                        Non-AC
                      </span>
                    </div>
                    <span className="text-[10px] text-amber-800 block leading-tight mt-0.5">
                      Standard Ceiling Fan • Non-AC Demand Pricing
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-amber-900 bg-white px-2 py-0.5 rounded border border-amber-200">
                  Non-AC
                </span>
              </div>
            )}
          </div>

          {/* Body Section based on Room Status */}
          {room.status === 'AVAILABLE' && (
            <div className="py-1">
              <div className="bg-stone-50/80 rounded-lg p-2.5 border border-stone-200 mb-2">
                <div className="flex justify-between items-center text-xs text-stone-600">
                  <span className="font-semibold text-stone-700">Tariff Model:</span>
                  <span className="font-bold text-stone-900 bg-white px-2 py-0.5 rounded border border-stone-200">
                    Custom / Demand Driven
                  </span>
                </div>
                <div className="text-[11px] text-emerald-800 mt-1.5 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Vacant • Enter agreed price at check-in
                </div>
              </div>
              <p className="text-[11px] text-stone-400">
                No fixed price • Custom rate per booking based on demand
              </p>
            </div>
          )}

          {room.status === 'OCCUPIED' && booking && (
            <div className="space-y-2 py-1">
              <div className="bg-rose-50/60 border border-rose-200 rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900 line-clamp-1">
                  <User className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>{booking.guest.fullName}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-stone-600 mt-1">
                  <Phone className="w-3 h-3 text-stone-400 shrink-0" />
                  <span>{booking.guest.primaryPhone}</span>
                  <span className="text-stone-300">•</span>
                  <span className="text-stone-500 line-clamp-1">{booking.guest.homeCity}</span>
                </div>
              </div>

              {/* Stay Duration & Agreed Rate */}
              <div className="grid grid-cols-2 gap-1.5 text-[11px] bg-stone-50 p-2 rounded-lg border border-stone-200">
                <div>
                  <span className="text-stone-400 block text-[10px] uppercase font-bold">Agreed Tariff</span>
                  <span className="text-stone-900 font-bold block mt-0.5">
                    {formatCurrency(booking.tariffPerDay)} /day
                  </span>
                  {booking.hasExtraBed && (
                    <span className="text-[10px] text-amber-800 block mt-0.5">
                      +Extra Bed ({booking.extraBedCount || 1} @ ₹150)
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px] uppercase font-bold">Stay Duration</span>
                  <span className="text-stone-900 font-bold mt-0.5 block">
                    {bill?.durationFormatted.split('(')[0] || '1 day'}
                  </span>
                </div>
              </div>

              {/* Financial Snapshot */}
              <div className="flex items-center justify-between text-xs px-1 pt-0.5">
                <span className="text-stone-500 text-[11px]">
                  Adv: <strong className="text-stone-800">{formatCurrency(bill?.totalPaidAdvance || 0)}</strong>
                </span>
                <span className="text-[11px]">
                  Due:{' '}
                  <strong
                    className={`font-black ${
                      (bill?.balanceDue || 0) > 0 ? 'text-rose-700' : 'text-emerald-700'
                    }`}
                  >
                    {formatCurrency(bill?.balanceDue || 0)}
                  </strong>
                </span>
              </div>
            </div>
          )}

          {room.status === 'CLEANING_NEEDED' && (
            <div className="py-2 space-y-2">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-950">
                <p className="text-xs font-bold flex items-center gap-1.5 text-amber-900">
                  <Sparkles className="w-4 h-4 text-amber-600 animate-spin" />
                  Housekeeping Requested
                </p>
                <p className="text-[11px] text-amber-800 mt-1">
                  Guest checked out. Change linen, disinfect room, and replenish soap/towels.
                </p>
              </div>
            </div>
          )}

          {room.status === 'MAINTENANCE' && (
            <div className="py-2 space-y-2">
              <div className="bg-stone-100 border border-stone-300 rounded-lg p-3 text-stone-900">
                <p className="text-xs font-bold flex items-center gap-1.5 text-stone-800">
                  <Wrench className="w-4 h-4 text-stone-700" />
                  Room Under Maintenance / Blocked
                </p>
                <p className="text-[11px] text-stone-700 mt-1 font-medium">
                  {room.maintenanceReason || 'Scheduled repair & maintenance.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Card Footer Actions */}
        <div className="p-3 bg-stone-50 border-t border-stone-200 flex items-center gap-2">
          {room.status === 'AVAILABLE' && (
            <>
              <button
                id={`btn-checkin-${room.number}-${room.floorCode}`}
                onClick={() => setCheckInRoom(room)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                Check-In
              </button>

              <button
                id={`btn-block-room-${room.number}-${room.floorCode}`}
                onClick={() => setBlockRoomTarget(room)}
                title="Block room for maintenance / repairs"
                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 rounded-lg text-xs font-semibold transition-colors"
              >
                <Lock className="w-3.5 h-3.5 text-stone-600" />
                <span>Block</span>
              </button>
            </>
          )}

          {room.status === 'OCCUPIED' && (
            <button
              id={`btn-view-${room.number}-${room.floorCode}`}
              onClick={() => setViewingRoom(room)}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              Guest Folio & Billing
            </button>
          )}

          {room.status === 'CLEANING_NEEDED' && (
            <>
              <button
                id={`btn-clean-${room.number}-${room.floorCode}`}
                onClick={() => markRoomCleaned(room.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Mark Ready
              </button>

              <button
                onClick={() => setBlockRoomTarget(room)}
                title="Block room for repair instead of ready"
                className="flex items-center justify-center gap-1 py-2 px-2.5 bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 rounded-lg text-xs font-semibold transition-colors"
              >
                <Lock className="w-3.5 h-3.5 text-stone-600" />
                <span>Block</span>
              </button>
            </>
          )}

          {room.status === 'MAINTENANCE' && (
            <div className="w-full flex items-center gap-2">
              <button
                id={`btn-unblock-${room.number}-${room.floorCode}`}
                onClick={() => unblockRoom(room.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Mark Resolved & Ready
              </button>

              <button
                onClick={() => setBlockRoomTarget(room)}
                title="View or modify block details"
                className="py-2 px-2.5 bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 rounded-lg text-xs font-semibold transition-colors"
              >
                <Wrench className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const groundFloorRooms = filteredRooms.filter((r) => r.floor === 'Ground Floor');
  const firstFloorRooms = filteredRooms.filter((r) => r.floor === 'First Floor');

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Search & Operational Controls Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs mb-6 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Quick Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="search-input"
              type="text"
              placeholder="Search Room # (101-111), Guest Name, Phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-stone-900 focus:bg-white text-stone-900"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs px-1 font-semibold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 text-xs">
            {/* Floor Filter */}
            <div className="inline-flex bg-stone-100 p-0.5 rounded-lg border border-stone-200 shrink-0">
              <button
                id="filter-floor-all"
                onClick={() => setSelectedFloor('all')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                  selectedFloor === 'all'
                    ? 'bg-white text-stone-900 shadow-xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                All 11 Rooms
              </button>
              <button
                id="filter-floor-ground"
                onClick={() => setSelectedFloor('Ground Floor')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                  selectedFloor === 'Ground Floor'
                    ? 'bg-white text-stone-900 shadow-xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Ground Floor (6)
              </button>
              <button
                id="filter-floor-first"
                onClick={() => setSelectedFloor('First Floor')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                  selectedFloor === 'First Floor'
                    ? 'bg-white text-stone-900 shadow-xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                First Floor (5)
              </button>
            </div>

            {/* AC Mode Filter */}
            <div className="inline-flex bg-stone-100 p-0.5 rounded-lg border border-stone-200 shrink-0">
              <button
                onClick={() => setSelectedAcMode('all')}
                className={`px-2.5 py-1.5 rounded-md font-semibold transition-colors ${
                  selectedAcMode === 'all'
                    ? 'bg-white text-stone-900 shadow-xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                All Modes
              </button>
              <button
                onClick={() => setSelectedAcMode('AC_ON')}
                className={`px-2.5 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1 ${
                  selectedAcMode === 'AC_ON'
                    ? 'bg-white text-sky-900 shadow-xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Wind className="w-3 h-3 text-sky-600" />
                AC Active
              </button>
              <button
                onClick={() => setSelectedAcMode('AC_OFF')}
                className={`px-2.5 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1 ${
                  selectedAcMode === 'AC_OFF'
                    ? 'bg-white text-stone-900 shadow-xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Fan className="w-3 h-3 text-stone-500" />
                Non-AC
              </button>
            </div>

            {/* Status Filter */}
            <select
              id="filter-status-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="px-3 py-1.5 bg-stone-100 border border-stone-200 rounded-lg text-xs font-semibold text-stone-700 focus:outline-hidden"
            >
              <option value="all">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="OCCUPIED">Occupied</option>
              <option value="CLEANING_NEEDED">Cleaning Needed</option>
              <option value="MAINTENANCE">Blocked / Maintenance</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Filter Banner when selected from Header or Dropdown */}
      {selectedStatus !== 'all' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-stone-100 border border-stone-300 px-4 py-3 rounded-xl mb-6 shadow-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-xs text-stone-600">Active View Filter:</span>
            <span
              className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                selectedStatus === 'AVAILABLE'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : selectedStatus === 'OCCUPIED'
                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                  : selectedStatus === 'CLEANING_NEEDED'
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-stone-200 text-stone-800 border border-stone-400'
              }`}
            >
              {selectedStatus === 'AVAILABLE' && 'Available Rooms (Ready for Check-In)'}
              {selectedStatus === 'OCCUPIED' && 'Occupied Rooms (Currently In Stay)'}
              {selectedStatus === 'CLEANING_NEEDED' && 'Cleaning Needed (Housekeeping)'}
              {selectedStatus === 'MAINTENANCE' && 'Blocked Rooms (Under Repair / Maintenance)'}
            </span>
            <span className="text-xs text-stone-500 font-medium">
              — {filteredRooms.length} of 11 rooms matching
            </span>
          </div>

          <button
            id="btn-clear-status-filter"
            onClick={() => setSelectedStatus('all')}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white hover:bg-stone-50 text-stone-800 text-xs font-bold rounded-lg border border-stone-300 shadow-xs transition-colors shrink-0"
          >
            Show All 11 Rooms
          </button>
        </div>
      )}

      {/* Main Room Grid Content */}
      {viewGrouping === 'by_floor' && selectedFloor === 'all' ? (
        <div className="space-y-8">
          {/* Ground Floor Section */}
          <div>
            <div className="flex items-center justify-between border-b border-stone-200 pb-2.5 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
                <h3 className="text-sm sm:text-base font-black text-stone-900 uppercase tracking-wide">
                  Ground Floor
                </h3>
                <span className="text-xs font-semibold text-stone-500 bg-stone-100 px-2.5 py-0.5 rounded-full border border-stone-200">
                  6 Rooms: 101, 102, 103, 104, 105 (Non-AC), 111
                </span>
              </div>
              <span className="text-xs text-stone-500">
                {groundFloorRooms.length} Matching
              </span>
            </div>

            {groundFloorRooms.length === 0 ? (
              <div className="bg-stone-50 border border-dashed border-stone-300 rounded-xl p-6 text-center text-stone-500 text-xs">
                {selectedStatus === 'MAINTENANCE' ? (
                  <p className="flex items-center justify-center gap-1.5 text-stone-600 font-medium">
                    <Wrench className="w-4 h-4 text-stone-400" />
                    No rooms on Ground Floor are currently Blocked / Under Maintenance.
                  </p>
                ) : (
                  `No rooms on Ground Floor currently in ${selectedStatus} status.`
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {groundFloorRooms.map(renderRoomCard)}
              </div>
            )}
          </div>

          {/* First Floor Section */}
          <div>
            <div className="flex items-center justify-between border-b border-stone-200 pb-2.5 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-600" />
                <h3 className="text-sm sm:text-base font-black text-stone-900 uppercase tracking-wide">
                  First Floor
                </h3>
                <span className="text-xs font-semibold text-stone-500 bg-stone-100 px-2.5 py-0.5 rounded-full border border-stone-200">
                  5 Rooms: 106, 107, 108, 109 (Non-AC), 110 (Non-AC)
                </span>
              </div>
              <span className="text-xs text-stone-500">
                {firstFloorRooms.length} Matching
              </span>
            </div>

            {firstFloorRooms.length === 0 ? (
              <div className="bg-stone-50 border border-dashed border-stone-300 rounded-xl p-6 text-center text-stone-500 text-xs">
                {selectedStatus === 'MAINTENANCE' ? (
                  <p className="flex items-center justify-center gap-1.5 text-stone-600 font-medium">
                    <Wrench className="w-4 h-4 text-stone-400" />
                    No rooms on First Floor are currently Blocked / Under Maintenance.
                  </p>
                ) : (
                  `No rooms on First Floor currently in ${selectedStatus} status.`
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {firstFloorRooms.map(renderRoomCard)}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Flat Grid View if floor filtered */
        <div>
          <div className="flex items-center justify-between border-b border-stone-200 pb-2.5 mb-4">
            <h3 className="text-sm font-bold text-stone-800 uppercase tracking-wide">
              {selectedFloor !== 'all' ? selectedFloor : 'Room Overview'} ({filteredRooms.length} of 11 Rooms)
            </h3>
            <span className="text-xs text-stone-500">
              {filteredRooms.filter((r) => r.status === 'AVAILABLE').length} Available
            </span>
          </div>

          {filteredRooms.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-xl p-12 text-center text-stone-500">
              <Search className="w-8 h-8 text-stone-400 mx-auto mb-2" />
              <p className="font-bold text-sm text-stone-800">No rooms match your filter criteria.</p>
              <p className="text-xs text-stone-400 mt-1">
                Try clearing search or resetting floor and status filters.
              </p>
              <button
                onClick={() => {
                  setSelectedStatus('all');
                  setSelectedFloor('all');
                  setSearchQuery('');
                }}
                className="mt-3 px-3 py-1.5 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800 transition-colors"
              >
                Show All 11 Rooms
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredRooms.map(renderRoomCard)}
            </div>
          )}
        </div>
      )}
    </main>
  );
};
